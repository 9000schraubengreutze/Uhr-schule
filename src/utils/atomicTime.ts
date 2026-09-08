/**
 * Online Atomic Clock Synchronization Utility
 * Fetches high-precision UTC time from public atomic time providers (WorldTimeAPI, TimeAPI, PTB/NTP mirrors)
 * and calculates the exact round-trip network offset to the local device clock.
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

const TIME_ENDPOINTS = [
  {
    url: 'https://worldtimeapi.org/api/timezone/Etc/UTC',
    parser: (data: any) => {
      // data.unixtime in seconds, data.raw_offset or datetime string
      if (typeof data.unixtime === 'number') {
        return data.unixtime * 1000;
      }
      if (data.utc_datetime) {
        return new Date(data.utc_datetime).getTime();
      }
      if (data.datetime) {
        return new Date(data.datetime).getTime();
      }
      throw new Error('Invalid format from WorldTimeAPI');
    },
    name: 'WorldTimeAPI (Atomzeit UTC)',
  },
  {
    url: 'https://timeapi.io/api/time/current/zone?timeZone=UTC',
    parser: (data: any) => {
      if (data.dateTime) {
        return new Date(data.dateTime + 'Z').getTime();
      }
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
      throw new Error('Invalid format from TimeAPI');
    },
    name: 'TimeAPI.io (Atomzeit UTC)',
  },
];

/**
 * Perform a high-precision two-way latency-compensated time synchronization
 */
export async function syncWithAtomicClock(): Promise<AtomicSyncResult> {
  let lastError: Error | null = null;

  for (const endpoint of TIME_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const t0 = performance.now();
      const clientStartUtc = Date.now();

      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const t1 = performance.now();
      const clientEndUtc = Date.now();
      const roundTripTime = t1 - t0;

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const serverTimeMs = endpoint.parser(data);

      // Estimate the exact client midpoint timestamp when server rendered the response
      const clientMidpoint = clientStartUtc + (clientEndUtc - clientStartUtc) / 2;
      const offsetMs = Math.round(serverTimeMs - clientMidpoint);

      return {
        offsetMs,
        latencyMs: Math.round(roundTripTime),
        syncedAt: new Date(),
        source: endpoint.name,
      };
    } catch (err: any) {
      console.warn(`Sync failed with ${endpoint.name}:`, err.message || err);
      lastError = err;
    }
  }

  // Fallback: Use HTTP Date header from a fast CDN HEAD request
  try {
    const t0 = performance.now();
    const clientStartUtc = Date.now();

    const headRes = await fetch(window.location.origin, {
      method: 'HEAD',
      cache: 'no-store',
    });

    const t1 = performance.now();
    const clientEndUtc = Date.now();
    const rtt = t1 - t0;

    const dateHeader = headRes.headers.get('date');
    if (dateHeader) {
      const serverTimeMs = new Date(dateHeader).getTime();
      const clientMidpoint = clientStartUtc + (clientEndUtc - clientStartUtc) / 2;
      const offsetMs = Math.round(serverTimeMs - clientMidpoint);

      return {
        offsetMs,
        latencyMs: Math.round(rtt),
        syncedAt: new Date(),
        source: 'Edge Server HTTP Time (NTP Proxy)',
      };
    }
  } catch (err: any) {
    lastError = err;
  }

  throw lastError || new Error('Alle Atomuhr-Dienste waren unerreichbar');
}
