// Hymm.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCachedHymnDetail } from "../utils/offlineSync";
import { API_BASE } from "./config";

type Hymn = {
  id: number;
  hymn_number: number;
  title: string;
  lyrics: string;
  theme?: string | null;
  scripture_ref?: string | null;
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
  goldLight: "#FBF6E9",
};

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ icon, label }: { icon?: string; label: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
    }}
  >
    {icon ? <Text style={{ fontSize: 13 }}>{icon}</Text> : null}
    <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
      {label}
    </Text>
  </View>
);

// ─── MenuItem ───────────────────────────────────────────────────────────────── (added back)
const MenuItem = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
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
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: C.accentLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
    </View>
    <Text
      style={{
        fontSize: 15,
        fontWeight: "600",
        color: C.text,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Hymm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);

  const loadFromCache = async () => {
    if (!id) return;
    try {
      const cached = await getCachedHymnDetail(id);
      if (cached) {
        setHymn(cached.hymn);
      }
    } catch (e) {
      console.warn("Failed to load hymn detail from cache", e);
    }
  };

  const fetchFresh = async (silent = false) => {
    if (!id) return;
    if (!silent && firstLoad) {
      setLoading(true);
    }
    setErr("");

    try {
      const res = await fetch(
        `${API_BASE}/hymn_get.php?id=${encodeURIComponent(String(id || ""))}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");

      setHymn(data.hymn);

      if (firstLoad) setFirstLoad(false);
    } catch (e: any) {
      if (!silent) {
        if (e.message?.includes("fetch") || e.message?.includes("Network")) {
          const cached = await getCachedHymnDetail(id);
          if (cached && cached.hymn) {
            setErr("Offline mode activated ");
          } else {
            setErr("Offline mode – no saved data for this hymn yet");
          }
        } else {
          setErr(e.message || "Failed to load hymn");
        }
      }
      console.warn("Fetch error:", e);
    } finally {
      if (!silent && firstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFresh();
      setFirstLoad(false);
    })();
  }, [id]);

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
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.bg,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: C.border,
            backgroundColor: C.surface,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 18, color: C.text }}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: C.text,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {hymn ? `${hymn.hymn_number}. ${hymn.title}` : "Hymn"}
          </Text>
          <Text
            style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}
            numberOfLines={1}
          >
            {hymn?.theme ? hymn.theme : "Lyrics"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: C.border,
            backgroundColor: C.surface,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <View style={{ gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: i === 1 ? 12 : 16,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: C.text,
                }}
              />
            ))}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && firstLoad ? (
          <View style={{ paddingTop: 40, alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={C.accent} />
            <Text style={{ fontSize: 13, color: C.textSub }}>
              Loading hymn…
            </Text>
          </View>
        ) : null}

        {err ? (
          <View
            style={{
              backgroundColor: "#FEF0EF",
              borderWidth: 1,
              borderColor: "#F5C6C2",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 13, color: C.danger, flex: 1 }}>
              {err}
            </Text>
          </View>
        ) : null}

        {hymn && (
          <View style={{ gap: 14 }}>
            {/* ── CHIPS ──────────────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Chip label={`Hymn ${hymn.hymn_number}`} />
              {hymn.scripture_ref && (
                <Chip icon="📖" label={hymn.scripture_ref} />
              )}
              {hymn.theme && <Chip icon="🏷" label={hymn.theme} />}
            </View>

            {/* ── LYRICS CARD ────────────────────────────────────────────── */}
            <View
              style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 18,
                overflow: "hidden",
                shadowColor: "#1A1714",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: C.accentLight,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#DDD0C0",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 18 }}>♪</Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "900",
                    color: C.accentDark,
                    flex: 1,
                    letterSpacing: -0.3,
                  }}
                >
                  {hymn.title}
                </Text>
              </View>

              <View style={{ padding: 18 }}>
                <Text
                  style={{
                    fontSize: 15,
                    lineHeight: 27,
                    color: C.text,
                    letterSpacing: 0.1,
                  }}
                >
                  {hymn.lyrics}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

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
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: C.text,
                    letterSpacing: -0.3,
                  }}
                >
                  Hymn {hymn?.hymn_number}
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}
                  numberOfLines={1}
                >
                  {hymn?.title}
                </Text>
              </View>
            </View>

            <MenuItem
              icon="✏️"
              label="Edit hymn text"
              onPress={() => {
                setMenuOpen(false);
                router.push({
                  pathname: "/edithymm",
                  params: { id: String(hymn?.id || "") },
                });
              }}
            />
            <MenuItem
              icon="🏠"
              label="Back to home"
              onPress={() => {
                setMenuOpen(false);
                router.push("/");
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
