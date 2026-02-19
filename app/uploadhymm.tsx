import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function UploadHymm() {
  const router = useRouter();
  const [hymnNumber, setHymnNumber] = useState("");
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [theme, setTheme] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const num = parseInt(hymnNumber, 10);
    if (!num || num <= 0)
      return Alert.alert("Error", "Enter a valid hymn number");
    if (!title.trim()) return Alert.alert("Error", "Enter title");
    if (!lyrics.trim()) return Alert.alert("Error", "Enter lyrics");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hymn_create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hymn_number: num,
          title: title.trim(),
          lyrics: lyrics.trim(),
          language: "margi",
          theme: theme.trim() || null,
          scripture_ref: scriptureRef.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");

      Alert.alert("Success", "Hymn added!");
      router.replace({ pathname: "/hymm", params: { id: String(data.id) } });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ gap: 12 }}>
        <TextInput
          value={hymnNumber}
          onChangeText={setHymnNumber}
          keyboardType="number-pad"
          placeholder="Hymn number (e.g. 12)"
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
          placeholder="Paste full hymn lyrics here..."
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            minHeight: 220,
            textAlignVertical: "top",
          }}
        />

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          style={{
            backgroundColor: "black",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white" }}>Submit Hymn</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
