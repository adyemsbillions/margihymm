// utils/offlineSync.ts
import * as FileSystem from "expo-file-system";

export type HymnRow = {
  id: number;
  hymn_number: number;
  title: string;
  language: string;
  created_at: string;
};

export type FullHymn = {
  id: number;
  hymn_number: number;
  title: string;
  lyrics: string;
  theme?: string | null;
  scripture_ref?: string | null;
};

export type AudioRow = {
  id: number;
  audio_title?: string | null;
  audio_type: string;
  uploader_name?: string | null;
  submitted_at: string;
  audio_url: string;
};

export type CachedDetail = { hymn: FullHymn; audios: AudioRow[] };

const BASE_DIR = FileSystem.documentDirectory + "margi_hymns/";
const LIST_FILE = BASE_DIR + "list.json";
const DETAILS_DIR = BASE_DIR + "details/";

// ---------- helpers ----------
async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function writeJson(path: string, data: any) {
  await ensureDir(BASE_DIR);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isNetworkError(msg?: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("network") ||
    m.includes("fetch") ||
    m.includes("failed to fetch")
  );
}

// ---------- PUBLIC: list ----------
export async function getCachedHymnList(): Promise<HymnRow[]> {
  const cached = await readJson<{ hymns: HymnRow[] }>(LIST_FILE);
  return cached?.hymns || [];
}

// ---------- PUBLIC: detail ----------
export async function getCachedHymnDetail(
  id: string | number,
): Promise<CachedDetail | null> {
  const hid = Number(id);
  if (!hid) return null;
  await ensureDir(DETAILS_DIR);
  const path = DETAILS_DIR + `hymn_${hid}.json`;
  return await readJson<CachedDetail>(path);
}

// ---------- PUBLIC: check if full offline is ready ----------
export async function getOfflineStatus() {
  const list = await getCachedHymnList();
  if (!list.length) return { ready: false, count: 0 };

  // check first 10 hymns have details (quick check)
  const sample = list.slice(0, Math.min(10, list.length));
  let ok = 0;
  for (const h of sample) {
    const d = await getCachedHymnDetail(h.id);
    if (d?.hymn?.id) ok++;
  }
  const ready = ok === sample.length;
  return { ready, count: list.length };
}

// ---------- PUBLIC: FULL SYNC (downloads ALL hymns + ALL details) ----------
export async function syncAllHymns(
  API_BASE: string,
  opts?: { force?: boolean },
) {
  const force = !!opts?.force;

  await ensureDir(BASE_DIR);
  await ensureDir(DETAILS_DIR);

  // 1) download list
  const listRes = await fetch(`${API_BASE}/hymns_list.php?lang=margi`, {
    cache: "no-store",
  });
  const listRaw = await listRes.text();

  let listData: any;
  try {
    listData = JSON.parse(listRaw);
  } catch {
    throw new Error(
      `Server returned non-JSON for list.\nHTTP ${listRes.status}\n\n${listRaw.slice(0, 900)}`,
    );
  }

  if (!listRes.ok || !listData.ok) {
    throw new Error(listData?.error || `List failed HTTP ${listRes.status}`);
  }

  const hymns: HymnRow[] = listData.hymns || [];
  await writeJson(LIST_FILE, {
    hymns,
    saved_at: new Date().toISOString(),
  });

  // 2) download details for ALL
  let cached = 0;
  let skipped = 0;
  let failed = 0;

  for (const h of hymns) {
    const hid = Number(h.id);
    if (!hid) continue;

    const detailPath = DETAILS_DIR + `hymn_${hid}.json`;

    if (!force) {
      const existing = await FileSystem.getInfoAsync(detailPath);
      if (existing.exists) {
        skipped++;
        continue;
      }
    }

    try {
      const detailRes = await fetch(
        `${API_BASE}/hymn_get.php?id=${encodeURIComponent(String(hid))}`,
        { cache: "no-store" },
      );
      const detailRaw = await detailRes.text();
      let detailData: any;

      try {
        detailData = JSON.parse(detailRaw);
      } catch {
        failed++;
        continue;
      }

      if (!detailRes.ok || !detailData.ok) {
        failed++;
        continue;
      }

      const payload: CachedDetail = {
        hymn: detailData.hymn,
        audios: detailData.audios || [],
      };

      await writeJson(detailPath, payload);
      cached++;
    } catch {
      failed++;
    }
  }

  return { count: hymns.length, cached, skipped, failed };
}

// ---------- OPTIONAL: clear cache ----------
export async function clearOfflineCache() {
  try {
    const info = await FileSystem.getInfoAsync(BASE_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
    }
  } catch {}
}
