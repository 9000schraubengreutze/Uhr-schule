export interface SyncResult {
  offsetMs: number;
  latencyMs: number;
  source: string;
  syncedAt: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface AtomicTimeState {
  status: SyncStatus;
  offsetMs: number;
  latencyMs: number;
  lastSyncTime: number | null;
  syncSource: string;
  errorMessage: string | null;
  isAtomicEnabled: boolean;
}

// Single precision ping to a target time API
async function pingServerTime(url: string): Promise<{ serverTime: number; latency: number }> {
  const t0 = performance.now();
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }

  const t1 = performance.now();
  const latency = Math.round(t1 - t0);

  const data = await res.json();
  let serverTime: number;

  if (typeof data.timestamp === 'number') {
    // /api/time format
    serverTime = data.timestamp;
  } else if (data.date_time) {
    // timeapi.io format (e.g. "2026-09-04T12:57:20.211010+00:00")
    serverTime = new Date(data.date_time).getTime();
  } else if (data.datetime) {
    // worldtimeapi format
    serverTime = new Date(data.datetime).getTime();
  } else {
    throw new Error('Unbekanntes Zeitformat');
  }

  return { serverTime, latency };
}

// Fallback using HTTP Date Header (e.g. from current domain)
async function pingHttpDateHeader(): Promise<{ serverTime: number; latency: number }> {
  const t0 = performance.now();
  const res = await fetch('/', {
    method: 'HEAD',
    cache: 'no-store',
  });
  const t1 = performance.now();
  const latency = Math.round(t1 - t0);
  const dateHeader = res.headers.get('Date');
  if (!dateHeader) {
    throw new Error('Kein Date-Header vorhanden');
  }
  const serverTime = new Date(dateHeader).getTime();
  return { serverTime, latency };
}

/**
 * Synchronize with digital atomic clock / network time server.
 * Tries high-priority sources first (internal precision server, timeapi.io, then HTTP Date header).
 */
export async function syncWithAtomicClock(): Promise<SyncResult> {
  const sources = [
    {
      name: 'Lokaler Zeitserver (Google TrueTime / NTP)',
      fn: () => pingServerTime('/api/time'),
    },
    {
      name: 'Digitale Atomuhr (timeapi.io NTP UTC)',
      fn: () => pingServerTime('https://timeapi.io/api/v1/time/current/zone?timeZone=UTC'),
    },
    {
      name: 'HTTP Netzwerk-Referenzzeit (CDN Date Header)',
      fn: () => pingHttpDateHeader(),
    },
  ];

  let lastError: Error | null = null;

  for (const source of sources) {
    try {
      // Run 2 quick samples to reduce jitter
      const sample1 = await source.fn();
      let bestSample = sample1;

      try {
        const sample2 = await source.fn();
        if (sample2.latency < sample1.latency) {
          bestSample = sample2;
        }
      } catch {
        // If sample2 fails, continue with sample1
      }

      // Calculate time offset:
      // serverTime corresponds approximately to the midpoint of the request
      const estimatedServerNow = bestSample.serverTime + Math.round(bestSample.latency / 2);
      const localNow = Date.now();
      const offsetMs = estimatedServerNow - localNow;

      return {
        offsetMs,
        latencyMs: bestSample.latency,
        source: source.name,
        syncedAt: Date.now(),
      };
    } catch (err) {
      lastError = err as Error;
      // try next source
    }
  }

  throw lastError || new Error('Keine Atomuhr-Zeitquelle erreichbar');
}
