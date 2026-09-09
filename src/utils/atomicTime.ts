/**
 * Online Atomic Clock Synchronization Utility
 * Fetches high-precision UTC time from public atomic time providers and edge NTP servers,
 * calculating the exact two-way network offset (NTP algorithm) to eliminate local device clock errors.
 */

export interface AtomicSyncResult {
  offsetMs: number;
  latencyMs: number;
  syncedAt: Date;
  source: string;
}

export interface AtomicTimeState {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  offsetMs: number;
  latencyMs: number;
  lastSyncTime: Date | null;
  syncSource: string;
  errorMessage: string | null;
}

/**
 * Human-readable format of the clock offset
 * e.g. "+15ms", "-1.8s", or "-19m 37s"
 */
export function formatTimeOffset(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  const sign = offsetMs >= 0 ? '+' : '-';

  if (abs < 1000) {
    return `${sign}${abs}ms`;
  }
  if (abs < 60000) {
    return `${sign}${(abs / 1000).toFixed(1)}s`;
  }

  const mins = Math.floor(abs / 60000);
  const secs = Math.round((abs % 60000) / 1000);
  return `${sign}${mins}m ${secs}s`;
}

/**
 * Detailed German description of the offset
 */
export function formatTimeOffsetDetailed(offsetMs: number): string {
  const abs = Math.abs(offsetMs);
  const direction = offsetMs < 0 ? 'geht vor (zu schnell)' : 'geht nach (zu langsam)';

  if (abs < 1000) {
    return `${abs} Millisekunden (${direction})`;
  }
  if (abs < 60000) {
    return `${(abs / 1000).toFixed(1)} Sekunden (${direction})`;
  }

  const mins = Math.floor(abs / 60000);
  const secs = Math.round((abs % 60000) / 1000);
  if (secs === 0) {
    return `${mins} Minute${mins === 1 ? '' : 'n'} (${direction})`;
  }
  return `${mins} Minute${mins === 1 ? '' : 'n'} und ${secs} Sekunde${secs === 1 ? '' : 'n'} (${direction})`;
}

/**
 * High-reliability time endpoints in priority order
 */
interface TimeEndpoint {
  name: string;
  getUrl: () => string;
  parser: (res: Response) => Promise<number>;
  timeoutMs: number;
}

const TIME_ENDPOINTS: TimeEndpoint[] = [
  // 1. Local / Edge API route (instant 1ms round-trip if running with server / dev server)
  {
    name: 'WebClock Server / TrueTime NTP',
    getUrl: () => {
      try {
        return typeof window !== 'undefined' ? `${window.location.origin}/api/time` : '/api/time';
      } catch {
        return '/api/time';
      }
    },
    parser: async (res) => {
      const data = await res.json();
      if (typeof data.timestamp === 'number') {
        return data.timestamp;
      }
      throw new Error('Invalid local time API format');
    },
    timeoutMs: 1500,
  },
  // 2. TimeAPI.io (Global atomic clock UTC mirror)
  {
    name: 'TimeAPI.io (Atomzeit UTC)',
    getUrl: () => 'https://timeapi.io/api/time/current/zone?timeZone=UTC',
    parser: async (res) => {
      const data = await res.json();
      if (data.year && data.month && data.day) {
        return Date.UTC(
          data.year,
          data.month - 1,
          data.day,
          data.hour || 0,
          data.minute || 0,
          data.seconds || 0,
          data.milliSeconds || 0
        );
      }
      if (data.dateTime) {
        const ms = new Date(data.dateTime.endsWith('Z') ? data.dateTime : data.dateTime + 'Z').getTime();
        if (!isNaN(ms)) return ms;
      }
      throw new Error('Invalid TimeAPI UTC format');
    },
    timeoutMs: 3500,
  },
  // 3. Fast Edge HEAD request on own host / CDN (Vercel Edge / Cloudflare Date header)
  {
    name: 'Edge Server HTTP Time (NTP Proxy)',
    getUrl: () => {
      try {
        return typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
      } catch {
        return '/';
      }
    },
    parser: async (res) => {
      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const serverMs = new Date(dateHeader).getTime();
        if (!isNaN(serverMs)) return serverMs;
      }
      throw new Error('Missing or invalid HTTP Date header');
    },
    timeoutMs: 2500,
  },
  // 4. WorldTimeAPI (Secondary fallback)
  {
    name: 'WorldTimeAPI (Atomzeit UTC)',
    getUrl: () => 'https://worldtimeapi.org/api/timezone/Etc/UTC',
    parser: async (res) => {
      const data = await res.json();
      if (typeof data.unixtime === 'number') {
        return data.unixtime * 1000;
      }
      if (data.utc_datetime) {
        const ms = new Date(data.utc_datetime).getTime();
        if (!isNaN(ms)) return ms;
      }
      throw new Error('Invalid WorldTimeAPI format');
    },
    timeoutMs: 2500,
  },
];

/**
 * Perform a high-precision two-way latency-compensated time synchronization (NTP algorithm)
 */
export async function syncWithAtomicClock(): Promise<AtomicSyncResult> {
  let lastError: Error | null = null;

  for (const endpoint of TIME_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeoutMs);

      const url = endpoint.getUrl();
      const isHeadOnly = endpoint.name.includes('Edge Server HTTP Time');

      const t0 = performance.now();
      const clientStartUtc = Date.now();

      const response = await fetch(url, {
        method: isHeadOnly ? 'HEAD' : 'GET',
        headers: isHeadOnly ? undefined : { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const t1 = performance.now();
      const clientEndUtc = Date.now();
      const roundTripTime = Math.max(1, t1 - t0);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const serverTimeMs = await endpoint.parser(response);

      // NTP offset formula:
      // Client midpoint = clientStart + (roundTrip / 2)
      // Offset = ServerTime - ClientMidpoint
      const clientMidpoint = clientStartUtc + (clientEndUtc - clientStartUtc) / 2;
      const offsetMs = Math.round(serverTimeMs - clientMidpoint);

      return {
        offsetMs,
        latencyMs: Math.round(roundTripTime),
        syncedAt: new Date(),
        source: endpoint.name,
      };
    } catch (err: any) {
      // Quietly try next endpoint
      lastError = err;
    }
  }

  throw lastError || new Error('Kein Online-Atomuhr-Dienst erreichbar');
}
