import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 100% OFFLINE JSON (bundled in APK)
const HYMN_DATA = require("../assets/hymns_margi.json");

type Hymn = {
  id: number;
  hymn_number: number;
  title: string;
  language?: string;
  created_at?: string;
  theme?: string | null;
  scripture_ref?: string | null;
  lyrics: string; // ONE full text block
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
  gold: "#C9A84C",
};

// Build fast search text (title + number + lyrics)
function buildSearchText(h: Hymn) {
  return `${h.hymn_number} ${h.title} ${h.lyrics || ""}`.toLowerCase();
}

const HymnCard = ({ item, onPress }: { item: Hymn; onPress: () => void }) => (
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
        <Text style={{ fontSize: 12, color: C.textSub }} numberOfLines={1}>
          Margi
        </Text>
      </View>
    </View>

    <Text style={{ fontSize: 18, color: C.borderStrong, marginRight: 2 }}>
      ›
    </Text>
  </TouchableOpacity>
);

export default function Index() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const hymns: Hymn[] = useMemo(() => {
    const arr = Array.isArray(HYMN_DATA) ? (HYMN_DATA as Hymn[]) : [];
    return arr
      .slice()
      .sort((a, b) => (a.hymn_number || 0) - (b.hymn_number || 0));
  }, []);

  const searchable = useMemo(() => {
    return hymns.map((h) => ({ ...h, __search: buildSearchText(h) }));
  }, [hymns]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return searchable;

    // match by number or by words anywhere (title/lyrics)
    return searchable.filter((h) => {
      if (/^\d+$/.test(query)) {
        return (
          String(h.hymn_number).includes(query) || h.__search.includes(query)
        );
      }
      return h.__search.includes(query);
    });
  }, [q, searchable]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* HEADER */}
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
          100% offline hymn book
        </Text>

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
            placeholder="Search by title, words, or number…"
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

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
        >
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
            <Text style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}>
              {filtered.length} hymn{filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
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
      />

      {/* FOOTER TIP */}
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
          Tap any hymn to open the full text (offline).
        </Text>
      </View>
    </View>
  );
}
