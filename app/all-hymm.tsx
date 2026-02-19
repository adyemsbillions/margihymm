import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
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
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>All Hymns</Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search by hymn number, title, or lyrics..."
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      />

      {loading ? <ActivityIndicator /> : null}
      {err ? <Text style={{ color: "red" }}>{err}</Text> : null}

      <FlatList
        data={hymns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {/* Left: open hymn */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/hymm",
                  params: { id: String(item.id) },
                })
              }
              style={{ flex: 1 }}
            >
              <Text style={{ fontWeight: "800" }} numberOfLines={1}>
                {item.hymn_number}. {item.title}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 4 }} numberOfLines={1}>
                {item.language}
              </Text>
            </TouchableOpacity>

            {/* Right: edit button */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/edithymm",
                  params: { id: String(item.id) },
                })
              }
              style={{
                backgroundColor: "black",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ opacity: 0.7 }}>No hymns found.</Text>
          ) : null
        }
      />
    </View>
  );
}
