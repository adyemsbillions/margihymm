// app/uploadaudio.tsx  (FULL FILE - with better error logging)
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE } from "./config";

type HymnRow = { id: number; hymn_number: number; title: string };

export default function UploadAudio() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hymn_id?: string }>();

  const [search, setSearch] = useState("");
  const [hymns, setHymns] = useState<HymnRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedHymn, setSelectedHymn] = useState<HymnRow | null>(null);

  const [uploaderName, setUploaderName] = useState("");
  const [uploaderPhone, setUploaderPhone] = useState("");
  const [uploaderLocation, setUploaderLocation] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioType, setAudioType] = useState<
    "spoken" | "sung" | "instrumental" | "other"
  >("spoken");

  const [file, setFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);

  const [uploading, setUploading] = useState(false);

  const listUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    p.set("lang", "margi");
    return `${API_BASE}/hymns_list.php?${p.toString()}`;
  }, [search]);

  const loadHymns = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(listUrl);
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Non-JSON from server.\nHTTP ${res.status}\n\n${raw.slice(0, 800)}`,
        );
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      setHymns(data.hymns || []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not load hymns");
    } finally {
      setLoadingList(false);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.name || "audio.mp3",
        mimeType: asset.mimeType,
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not pick file");
    }
  };

  const upload = async () => {
    if (!selectedHymn) return Alert.alert("Error", "Select a hymn first");
    if (!file) return Alert.alert("Error", "Pick an audio file");

    setUploading(true);

    try {
      const form = new FormData();
      form.append("hymn_id", String(selectedHymn.id));
      form.append("uploader_name", uploaderName.trim());
      form.append("uploader_phone", uploaderPhone.trim());
      form.append("uploader_location", uploaderLocation.trim());
      form.append("audio_title", audioTitle.trim());
      form.append("audio_type", audioType);

      const lowerName = (file.name || "").toLowerCase();
      const safeType =
        file.mimeType ||
        (lowerName.endsWith(".m4a")
          ? "audio/mp4"
          : lowerName.endsWith(".wav")
            ? "audio/wav"
            : lowerName.endsWith(".aac")
              ? "audio/aac"
              : lowerName.endsWith(".3gp")
                ? "audio/3gpp"
                : "audio/mpeg");

      // @ts-ignore - React Native FormData file
      form.append("file", {
        uri: file.uri,
        name: file.name || "audio.mp3",
        type: safeType,
      });

      const res = await fetch(`${API_BASE}/audio_upload.php`, {
        method: "POST",
        body: form,
        // IMPORTANT: don't set Content-Type manually
      });

      const rawText = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Server returned non-JSON.\nHTTP ${res.status}\n\n${rawText.slice(0, 1200)}`,
        );
      }

      if (!res.ok || !data.ok) {
        const extra = data?.server_limits
          ? `\n\nServer limits:\nupload_max_filesize=${data.server_limits.upload_max_filesize}\npost_max_size=${data.server_limits.post_max_size}`
          : "";
        throw new Error(
          `Upload failed.\nHTTP ${res.status}\n${data.error || "Unknown error"}${extra}`,
        );
      }

      Alert.alert("Submitted", "Audio uploaded and waiting for approval.");
      router.replace({
        pathname: "/hymm",
        params: { id: String(selectedHymn.id) },
      });
    } catch (e: any) {
      Alert.alert("Upload Error", e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadHymns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  useEffect(() => {
    const hid = params.hymn_id ? parseInt(params.hymn_id, 10) : 0;
    if (!hid) return;
    const found = hymns.find((h) => h.id === hid);
    if (found) setSelectedHymn(found);
  }, [params.hymn_id, hymns]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "800" }}>Select Hymn</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search hymn title or number..."
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />

      {loadingList ? <ActivityIndicator /> : null}

      <FlatList
        data={hymns}
        keyExtractor={(i) => String(i.id)}
        style={{ maxHeight: 220 }}
        renderItem={({ item }) => {
          const active = selectedHymn?.id === item.id;
          return (
            <TouchableOpacity
              onPress={() => setSelectedHymn(item)}
              style={{
                borderWidth: 1,
                borderColor: active ? "black" : "#eee",
                padding: 10,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {item.hymn_number}. {item.title}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 8 }} />

      <Text style={{ fontSize: 16, fontWeight: "800" }}>Audio Details</Text>

      <TextInput
        value={uploaderName}
        onChangeText={setUploaderName}
        placeholder="Your name (optional)"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />
      <TextInput
        value={uploaderPhone}
        onChangeText={setUploaderPhone}
        placeholder="Phone (optional)"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />
      <TextInput
        value={uploaderLocation}
        onChangeText={setUploaderLocation}
        placeholder="Location / Church (optional)"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />
      <TextInput
        value={audioTitle}
        onChangeText={setAudioTitle}
        placeholder="Audio title (optional) e.g. Choir version"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />

      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {(["spoken", "sung", "instrumental", "other"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setAudioType(t)}
            style={{
              backgroundColor: audioType === t ? "black" : "#f1f1f1",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: audioType === t ? "white" : "black" }}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={pickAudio}
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white" }}>
          {file ? `Selected: ${file.name}` : "Pick Audio File"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={upload}
        disabled={uploading}
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white" }}>Submit for Approval</Text>
        )}
      </TouchableOpacity>

      {selectedHymn ? (
        <Text style={{ opacity: 0.7 }}>
          Selected hymn: {selectedHymn.hymn_number}. {selectedHymn.title}
        </Text>
      ) : null}
    </View>
  );
}
