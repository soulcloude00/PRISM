// T4: Offline cache — native: expo-sqlite, web: in-memory fallback (no crash)
let getCachedImpl: (q: string) => Promise<string | null> = async () => null;
let setCachedImpl: (q: string, answer: string) => Promise<void> = async () => {};
let cacheWavImpl: (name: string, b64: string) => Promise<string> = async () => '';

try {
  // Only load on native — web will throw, we catch
  const SQLite = require('expo-sqlite');
  const FileSystem = require('expo-file-system');
  const db = SQLite.openDatabaseSync('prism.db');
  db.execSync('CREATE TABLE IF NOT EXISTS genie_cache (q TEXT PRIMARY KEY, answer TEXT, ts INTEGER);');
  getCachedImpl = async (q: string) => {
    try {
      const row = db.getFirstSync<{ answer: string }>('SELECT answer FROM genie_cache WHERE q=?', [q]);
      return row?.answer || null;
    } catch { return null; }
  };
  setCachedImpl = async (q: string, answer: string) => {
    try {
      db.runSync('INSERT OR REPLACE INTO genie_cache (q, answer, ts) VALUES (?,?,?)', [q, answer, Date.now()]);
      db.execSync('DELETE FROM genie_cache WHERE q NOT IN (SELECT q FROM genie_cache ORDER BY ts DESC LIMIT 20)');
    } catch {}
  };
  cacheWavImpl = async (name: string, b64: string) => {
    const path = FileSystem.cacheDirectory + `wav_${name}.wav`;
    await FileSystem.writeAsStringAsync(path, b64, { encoding: (FileSystem as any).EncodingType.Base64 });
    return path;
  };
} catch {
  // Web fallback: in-memory Map
  const mem = new Map<string, string>();
  getCachedImpl = async (q: string) => mem.get(q) || null;
  setCachedImpl = async (q: string, answer: string) => {
    mem.set(q, answer);
    if (mem.size > 20) {
      const first = mem.keys().next().value;
      mem.delete(first);
    }
  };
}

export const getCached = getCachedImpl;
export const setCached = setCachedImpl;
export const cacheWav = cacheWavImpl;
