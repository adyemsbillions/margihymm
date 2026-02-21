import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
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

export default function AllHymm() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hymns, setHymns] = useState<HymnRow[]>([]);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    p.set("lang", "margi");
    if (q.trim()) p.set("q", q.trim());
    return `${API_BASE}/hymns_list.php?${p.toString()}`;
  }, [q]);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setHymns(data.hymns || []);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {/* Back */}
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
            }}
          >
            <Text style={{ fontSize: 18, color: C.text }}>‹</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              All Hymns
            </Text>
            <Text style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}>
              Edit mode
            </Text>
          </View>

          {/* Admin badge */}
          <View
            style={{
              backgroundColor: C.accentLight,
              borderWidth: 1,
              borderColor: "#DDD0C0",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: C.accent,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Admin
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
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
            placeholder="Search by number, title, or lyrics…"
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
            gap: 8,
          }}
        >
          {loading ? (
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
          paddingBottom: 50,
        }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
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

            {/* Tap to view */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/hymm",
                  params: { id: String(item.id) },
                })
              }
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
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
                  gap: 6,
                  marginTop: 4,
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
                >
                  {item.language}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Edit button */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/edithymm",
                  params: { id: String(item.id) },
                })
              }
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderWidth: 1.5,
                borderColor: C.borderStrong,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: C.bg,
              }}
            >
              <Text style={{ fontSize: 13 }}>✏️</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: C.text,
                  letterSpacing: 0.1,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingTop: 60, alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 36 }}>🎵</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>
                No hymns found
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
                Try a different search term.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
