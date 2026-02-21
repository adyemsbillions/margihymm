// utils/offlineSync.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../app/config"; // Correct path based on your structure

// ────────────────────────────────────────────────
// Types (keep consistent with your screens)
type HymnRow = {
  id: number;
  hymn_number: number;
  title: string;
  language: string;
  created_at: string;
};

type FullHymn = {
  id: number;
  hymn_number: number;
  title: string;
  lyrics: string;
  theme?: string | null;
  scripture_ref?: string | null;
};

type AudioRow = {
  id: number;
  audio_title?: string | null;
  audio_type: string;
  uploader_name?: string | null;
  submitted_at: string;
  audio_url: string;
};

// ────────────────────────────────────────────────
// Cache keys
const LIST_CACHE_KEY = "@margi_hymns_list_cache";
const DETAIL_CACHE_PREFIX = "@margi_hymn_detail_";

// ────────────────────────────────────────────────
// Main sync function – downloads list + full details for all hymns
export async function syncAllHymns(
  options: {
    force?: boolean;
    silent?: boolean;
  } = {},
): Promise<boolean> {
  const { force = false, silent = true } = options;

  try {
    // 1. Fetch the list of all hymns
    const listUrl = `${API_BASE}/hymns_list.php?lang=margi`;
    const listRes = await fetch(listUrl, { cache: "no-store" });

    if (!listRes.ok) {
      throw new Error(`List fetch failed: ${listRes.status}`);
    }

    const listData = await listRes.json();
    if (!listData.ok) {
      throw new Error(listData.error || "Invalid list response");
    }

    const hymns: HymnRow[] = listData.hymns || [];

    // Save the list immediately
    await AsyncStorage.setItem(LIST_CACHE_KEY, JSON.stringify(hymns));

    if (!silent) {
      console.log(`Cached hymn list (${hymns.length} items)`);
    }

    // 2. Fetch and cache full details (lyrics + audios) for each hymn
    let cachedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const hymn of hymns) {
      const cacheKey = `${DETAIL_CACHE_PREFIX}${hymn.id}`;

      // Skip if already cached (unless forcing refresh)
      const alreadyCached = await AsyncStorage.getItem(cacheKey);
      if (alreadyCached && !force) {
        skippedCount++;
        continue;
      }

      try {
        const detailUrl = `${API_BASE}/hymn_get.php?id=${hymn.id}`;
        const detailRes = await fetch(detailUrl, { cache: "no-store" });

        if (!detailRes.ok) {
          failedCount++;
          continue;
        }

        const detailData = await detailRes.json();
        if (!detailData.ok) {
          failedCount++;
          continue;
        }

        const payload = {
          hymn: detailData.hymn as FullHymn,
          audios: (detailData.audios || []) as AudioRow[],
        };

        await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
        cachedCount++;
      } catch (err) {
        failedCount++;
        // Only log first few failures to avoid console spam
        if (!silent && failedCount <= 5) {
          console.warn(
            `Failed to cache hymn #${hymn.hymn_number} (id ${hymn.id})`,
            err,
          );
        }
      }
    }

    if (!silent) {
      console.log(
        `Full sync completed:\n` +
          `  • List cached\n` +
          `  • ${cachedCount} hymns fully cached (lyrics + audios)\n` +
          `  • ${skippedCount} already cached (skipped)\n` +
          `  • ${failedCount} failed`,
      );
    }

    return true;
  } catch (err) {
    console.error("Full sync failed:", err);
    return false;
  }
}

// ────────────────────────────────────────────────
// Helper: Get cached list (for index screen)
export async function getCachedHymnList(): Promise<HymnRow[]> {
  try {
    const json = await AsyncStorage.getItem(LIST_CACHE_KEY);
    return json ? (JSON.parse(json) as HymnRow[]) : [];
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────
// Helper: Get cached detail for one hymn (for hymm screen)
export async function getCachedHymnDetail(
  id: string | number,
): Promise<{ hymn: FullHymn; audios: AudioRow[] } | null> {
  try {
    const key = `${DETAIL_CACHE_PREFIX}${id}`;
    const json = await AsyncStorage.getItem(key);
    if (!json) return null;
    return JSON.parse(json) as { hymn: FullHymn; audios: AudioRow[] };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────
// Optional: Clear everything (useful for testing)
export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(
      (k) => k === LIST_CACHE_KEY || k.startsWith(DETAIL_CACHE_PREFIX),
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
      console.log(`Cleared ${toRemove.length} cache entries`);
    }
  } catch (err) {
    console.warn("Clear cache failed", err);
  }
}
