import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const HYMN_DATA = require("../assets/hymns_margi.json");

type Hymn = {
  id: number;
  hymn_number: number;
  title: string;
  theme?: string | null;
  scripture_ref?: string | null;
  lyrics: string; // plain full text
};

const C = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#E8E2D9",
  text: "#1A1714",
  textSub: "#7A7168",
  textMuted: "#A89F94",
  accent: "#8B5E3C",
  accentLight: "#F2EBE3",
  accentDark: "#5C3D24",
};

export default function Hymm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const hymn: Hymn | null = useMemo(() => {
    const arr = Array.isArray(HYMN_DATA) ? (HYMN_DATA as Hymn[]) : [];
    const hid = parseInt(String(id || "0"), 10);
    return arr.find((h) => h.id === hid) || null;
  }, [id]);

  if (!hymn) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20 }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
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

        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: C.text }}>
            Hymn not found
          </Text>
          <Text style={{ marginTop: 8, color: C.textSub }}>
            This hymn id does not exist inside the offline JSON.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* HEADER */}
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
          }}
        >
          <Text style={{ fontSize: 18, color: C.text }}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: C.text,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {hymn.title}
          </Text>

          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
            Hymn {hymn.hymn_number}
          </Text>
        </View>

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
          <Text style={{ fontSize: 11, fontWeight: "800", color: C.accent }}>
            #{hymn.hymn_number}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: C.accentLight,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#DDD0C0",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 16 }}>♪</Text>
            <Text
              style={{ fontSize: 14, fontWeight: "900", color: C.accentDark }}
            >
              Full Text
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 15, lineHeight: 27, color: C.text }}>
              {hymn.lyrics}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
