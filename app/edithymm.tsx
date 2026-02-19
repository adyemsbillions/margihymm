import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE } from "./config";

type Hymn = {
  id: number;
  hymn_number: number;
  title: string;
  lyrics: string;
  theme?: string | null;
  scripture_ref?: string | null;
};

export default function EditHymm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [hymn, setHymn] = useState<Hymn | null>(null);

  const [hymnNumber, setHymnNumber] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [theme, setTheme] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/hymn_get.php?id=${encodeURIComponent(String(id || ""))}`,
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to load hymn");

      const h: Hymn = data.hymn;
      setHymn(h);

      setHymnNumber(String(h.hymn_number));
      setTitle(h.title || "");
      setLyrics(h.lyrics || "");
      setTheme(h.theme || "");
      setScriptureRef(h.scripture_ref || "");
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!hymn) return;

    const num = parseInt(hymnNumber, 10);
    if (!num || num <= 0)
      return Alert.alert("Error", "Enter a valid hymn number");
    if (!title.trim()) return Alert.alert("Error", "Title cannot be empty");
    if (!lyrics.trim()) return Alert.alert("Error", "Lyrics cannot be empty");

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/edithymm.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: hymn.id,
          hymn_number: num,
          title: title.trim(),
          lyrics: lyrics.trim(),
          theme: theme.trim(), // empty => clears on backend
          scripture_ref: scriptureRef.trim(), // empty => clears on backend
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Update failed");

      Alert.alert("Saved", "Hymn updated successfully.");
      router.replace({ pathname: "/hymm", params: { id: String(hymn.id) } });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {loading ? <ActivityIndicator /> : null}
      {err ? (
        <Text style={{ color: "red", marginBottom: 10 }}>{err}</Text>
      ) : null}

      {hymn ? (
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "800" }}>
            Edit Hymn #{hymn.hymn_number}
          </Text>

          <TextInput
            value={hymnNumber}
            onChangeText={setHymnNumber}
            keyboardType="number-pad"
            placeholder="Hymn number"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 10,
            }}
          />

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 10,
            }}
          />

          <TextInput
            value={theme}
            onChangeText={setTheme}
            placeholder="Theme (optional)"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 10,
            }}
          />

          <TextInput
            value={scriptureRef}
            onChangeText={setScriptureRef}
            placeholder="Scripture reference (optional)"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 10,
            }}
          />

          <TextInput
            value={lyrics}
            onChangeText={setLyrics}
            placeholder="Edit hymn lyrics..."
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 10,
              minHeight: 260,
              textAlignVertical: "top",
            }}
          />

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={{
              backgroundColor: "black",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white" }}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <Text style={{ opacity: 0.7, fontSize: 12 }}>
            Note: edits are immediate (no approval).
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
