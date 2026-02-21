// index.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCachedHymnList } from "../utils/offlineSync";
import { API_BASE } from "./config";

type HymnRow = {
  id: number;
  hymn_number: number;
  title: string;
  language: string;
  created_at: string;
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#E8E2D9",
  borderStrong: "#C8BFB0",
  text: "#1A1714",
  textSub: "#7A7168",
  textMuted: "#A89F94",
  accent: "#8B5E3C",
  accentLight: "#F2EBE3",
  accentDark: "#5C3D24",
  danger: "#C0392B",
  gold: "#C9A84C",
};

// ─── MenuItem ─────────────────────────────────────────────────────────────────
const MenuItem = ({
  label,
  onPress,
  danger,
  icon,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  icon?: string;
}) => (
  <TouchableOpacity
    activeOpacity={0.65}
    onPress={onPress}
    style={{
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    }}
  >
    {icon ? (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: danger ? "#FEF0EF" : C.accentLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
    ) : null}
    <Text
      style={{
        fontSize: 15,
        fontWeight: "600",
        color: danger ? C.danger : C.text,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── HymnCard ─────────────────────────────────────────────────────────────────
const HymnCard = ({
  item,
  onPress,
}: {
  item: HymnRow;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={{
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      shadowColor: "#1A1714",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    }}
  >
    {/* Number badge */}
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: C.accentLight,
        borderWidth: 1,
        borderColor: "#DDD0C0",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C.accent,
          letterSpacing: -0.3,
        }}
      >
        {item.hymn_number}
      </Text>
    </View>

    {/* Text */}
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: C.text,
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 4,
          gap: 6,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: C.gold,
          }}
        />
        <Text
          style={{
            fontSize: 12,
            color: C.textSub,
            textTransform: "capitalize",
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
        >
          {item.language}
        </Text>
      </View>
    </View>

    {/* Arrow */}
    <Text style={{ fontSize: 18, color: C.borderStrong, marginRight: 2 }}>
      ›
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Index() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hymns, setHymns] = useState<HymnRow[]>([]);
  const [err, setErr] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    p.set("lang", "margi");
    return `${API_BASE}/hymns_list.php?${p.toString()}`;
  }, [q]);

  const loadFromCache = async () => {
    try {
      const cached = await getCachedHymnList();
      if (cached.length > 0) {
        // Apply search filter from cache if query is active
        if (q.trim()) {
          const filtered = cached.filter(
            (h) =>
              h.title.toLowerCase().includes(q.trim().toLowerCase()) ||
              String(h.hymn_number).includes(q.trim()),
          );
          setHymns(filtered);
        } else {
          setHymns(cached);
        }
      }
    } catch (e) {
      console.warn("Failed to load list from cache", e);
    }
  };

  const fetchFresh = async (silent = false) => {
    if (!silent && firstLoad) {
      setLoading(true);
    }
    setErr("");

    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Request failed");

      const freshHymns = data.hymns || [];

      setHymns(
        q.trim()
          ? freshHymns.filter(
              (h: HymnRow) =>
                h.title.toLowerCase().includes(q.trim().toLowerCase()) ||
                String(h.hymn_number).includes(q.trim()),
            )
          : freshHymns,
      );
      setErr("");

      if (firstLoad) setFirstLoad(false);
    } catch (e: any) {
      if (!silent) {
        setErr(
          e.message?.includes("fetch")
            ? "No internet connection. Showing last saved list."
            : e.message || "Failed to load hymns",
        );
      }
      console.warn("Fetch error:", e);
    } finally {
      if (!silent && firstLoad) setLoading(false);
    }
  };

  // Initial load: cache first → then try fresh
  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFresh();
      setFirstLoad(false);
    })();
  }, []);

  // Re-fetch when search changes (after first load)
  useEffect(() => {
    if (!firstLoad) {
      fetchFresh(true); // silent
    }
  }, [url, firstLoad]);

  const handleRefresh = () => {
    fetchFresh();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <Text style={{ fontSize: 20 }}>♪</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: C.text,
                  letterSpacing: -0.5,
                }}
              >
                Margi Hymns
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: C.textSub,
                letterSpacing: 0.2,
                marginLeft: 28,
              }}
            >
              Browse & listen to real voices
            </Text>
          </View>

          {/* Menu button */}
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.7}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              borderWidth: 1.5,
              borderColor: C.border,
              backgroundColor: C.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#1A1714",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    width: i === 1 ? 14 : 18,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: C.text,
                  }}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor: C.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 2,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, color: C.textMuted }}>🔍</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by title, lyrics, or number…"
            placeholderTextColor={C.textMuted}
            style={{
              flex: 1,
              fontSize: 14,
              color: C.text,
              paddingVertical: 12,
            }}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, color: C.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
            justifyContent: "space-between",
          }}
        >
          {loading && firstLoad ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={{ fontSize: 12, color: C.textSub }}>Loading…</Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: C.accentLight,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#DDD0C0",
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: C.accent,
                }}
              />
              <Text
                style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}
              >
                {hymns.length} hymn{hymns.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleRefresh}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: C.text,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 13, color: "#fff", fontWeight: "700" }}>
              ↻ Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {err ? (
          <View
            style={{
              marginTop: 10,
              backgroundColor: "#FEF0EF",
              borderWidth: 1,
              borderColor: "#F5C6C2",
              borderRadius: 10,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={{ fontSize: 13, color: C.danger, flex: 1 }}>
              {err}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── LIST ───────────────────────────────────────────────────────────── */}
      <FlatList
        data={hymns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 40,
        }}
        renderItem={({ item }) => (
          <HymnCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/hymm",
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View
              style={{
                paddingTop: 60,
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 36 }}>🎵</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: C.text,
                  letterSpacing: 0.1,
                }}
              >
                {q.trim() ? "No matching hymns" : "No hymns found"}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: C.textSub,
                  textAlign: "center",
                  maxWidth: 220,
                  lineHeight: 19,
                }}
              >
                {q.trim()
                  ? "Try different words or refresh"
                  : "Check connection or pull to refresh"}
              </Text>
            </View>
          ) : null
        }
      />

      {/* ── FOOTER TIP ─────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: C.border,
          backgroundColor: C.bg,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 12 }}>💡</Text>
        <Text style={{ fontSize: 12, color: C.textSub, flex: 1 }}>
          Open a hymn to see approved audio recordings.
        </Text>
      </View>

      {/* ── BOTTOM SHEET MENU ──────────────────────────────────────────────── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(26,23,20,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingBottom: 20,
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: C.border,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>♪</Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "900",
                  color: C.text,
                  letterSpacing: -0.3,
                }}
              >
                Margi Hymns
              </Text>
            </View>

            <MenuItem
              icon="📝"
              label="Upload Hymn Text"
              onPress={() => {
                setMenuOpen(false);
                router.push("/uploadhymm");
              }}
            />
            <MenuItem
              icon="🎙️"
              label="Upload Audio"
              onPress={() => {
                setMenuOpen(false);
                router.push("/uploadaudio");
              }}
            />
            <MenuItem
              icon="✏️"
              label="All Hymns (Edit)"
              onPress={() => {
                setMenuOpen(false);
                router.push("/all-hymm");
              }}
            />
            <MenuItem
              icon="⚙️"
              label="Admin Dashboard"
              onPress={() => {
                setMenuOpen(false);
                router.push("/dashboard");
              }}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMenuOpen(false)}
              style={{
                margin: 20,
                marginBottom: 0,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: C.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: C.textSub }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
