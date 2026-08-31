import Constants from 'expo-constants';

export const API_URL =
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.68.119:8001';

type RetryOpts = { retries?: number; timeout?: number };

async function fetchWithTimeout(url: string, opts: RequestInit, timeout = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function apiPost<T>(path: string, body: any, opts: RetryOpts = {}): Promise<T> {
  const retries = opts.retries ?? 1;
  const timeout = opts.timeout ?? 15000;
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetchWithTimeout(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, timeout);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = (j as any).error || `HTTP ${r.status}`;
        const err: any = new Error(msg);
        err.status = r.status;
        err.retry = (j as any).retry;
        throw err;
      }
      return j as T;
    } catch (e: any) {
      lastErr = e;
      if (e.name === 'AbortError' || e.status === 429) {
        if (i < retries) {
          await new Promise(r => setTimeout(r, 800 * (i + 1)));
          continue;
        }
      }
      if (e.retry && i < retries) {
        await new Promise(r => setTimeout(r, 600));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function apiTTS(text: string): Promise<ArrayBuffer> {
  const r = await fetchWithTimeout(`${API_URL}/api/tts/cartesia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }, 20000);
  if (r.status === 429) throw Object.assign(new Error('Voice busy — try again'), { retry: true });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t.slice(0, 300));
  }
  return r.arrayBuffer();
}
