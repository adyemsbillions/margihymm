import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ADMIN_HEADER_KEY, API_BASE } from "./config";

type PendingRow = {
  id: number;
  hymn_id: number;
  hymn_number: number;
  hymn_title: string;
  audio_title?: string | null;
  audio_type: string;
  uploader_name?: string | null;
  submitted_at: string;
  audio_url: string;
};

export default function Dashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const stop = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch {}
    setSound(null);
    setPlayingId(null);
  };

  const play = async (row: PendingRow) => {
    await stop();
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: row.audio_url },
        { shouldPlay: true },
      );
      setSound(s);
      setPlayingId(row.id);
      s.setOnPlaybackStatusUpdate((st) => {
        // @ts-ignore
        if (st?.didJustFinish) stop();
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not play");
    }
  };

  const loadPending = async () => {
    if (!adminKey.trim())
      return Alert.alert("Admin key", "Enter admin key first");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_pending.php`, {
        headers: { [ADMIN_HEADER_KEY]: adminKey.trim() },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setPending(data.pending || []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not load pending");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: number) => {
    if (!adminKey.trim())
      return Alert.alert("Admin key", "Enter admin key first");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_approve.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_HEADER_KEY]: adminKey.trim(),
        },
        body: JSON.stringify({ id, approved_by: "Admin" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setPending((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Approve failed");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: number) => {
    if (!adminKey.trim())
      return Alert.alert("Admin key", "Enter admin key first");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_reject.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_HEADER_KEY]: adminKey.trim(),
        },
        body: JSON.stringify({ id, reason: "Rejected", approved_by: "Admin" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setPending((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "800" }}>Admin Key</Text>
      <TextInput
        value={adminKey}
        onChangeText={setAdminKey}
        placeholder="Enter ADMIN_KEY"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={loadPending}
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
          <Text style={{ color: "white" }}>Load Pending Audios</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={pending}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              padding: 12,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "800" }}>
              Hymn {item.hymn_number}: {item.hymn_title}
            </Text>
            <Text style={{ opacity: 0.7, marginTop: 4 }}>
              {item.audio_title || "Audio"} • {item.audio_type.toUpperCase()} •
              by {item.uploader_name || "Anonymous"}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <TouchableOpacity
                onPress={() => (playingId === item.id ? stop() : play(item))}
                style={{
                  backgroundColor: "black",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>
                  {playingId === item.id ? "Stop" : "Play"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => approve(item.id)}
                style={{
                  backgroundColor: "black",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => reject(item.id)}
                style={{
                  backgroundColor: "black",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
