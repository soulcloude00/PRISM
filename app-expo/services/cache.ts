// T4: Offline cache — expo-sqlite + FileSystem wav cache (stale-while-revalidate)
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const db = SQLite.openDatabaseSync('prism.db');
db.execSync('CREATE TABLE IF NOT EXISTS genie_cache (q TEXT PRIMARY KEY, answer TEXT, ts INTEGER);');

export async function getCached(q: string) {
  const row = db.getFirstSync<{answer: string}>('SELECT answer FROM genie_cache WHERE q=?', [q]);
  return row?.answer || null;
}
export async function setCached(q: string, answer: string) {
  db.runSync('INSERT OR REPLACE INTO genie_cache (q, answer, ts) VALUES (?,?,?)', [q, answer, Date.now()]);
  // keep last 20
  db.execSync('DELETE FROM genie_cache WHERE q NOT IN (SELECT q FROM genie_cache ORDER BY ts DESC LIMIT 20)');
}
export async function cacheWav(name: string, b64: string) {
  const path = FileSystem.cacheDirectory + `wav_${name}.wav`;
  await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}
