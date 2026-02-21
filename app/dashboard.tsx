// app/dashboard.tsx
// Everything is HIDDEN until the admin key is verified ("unlocked").
// No AsyncStorage needed.

import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
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
  const router = useRouter();

  // LOCK STATE
  const [unlocked, setUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  // DASHBOARD STATE
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [err, setErr] = useState("");

  // AUDIO
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // MENU
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try {
      return { ok: true, json: JSON.parse(raw), raw };
    } catch {
      return { ok: false, json: null, raw };
    }
  };

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
    setErr("");
    const key = adminKey.trim();
    if (!key) return Alert.alert("Admin key", "Enter admin key first");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_pending.php`, {
        headers: { [ADMIN_HEADER_KEY]: key },
      });

      const parsed = await fetchJsonSafe(res);
      if (!parsed.ok) {
        throw new Error(
          `Server returned non-JSON.\nHTTP ${res.status}\n\n${parsed.raw.slice(0, 800)}`,
        );
      }

      const data = parsed.json;
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");

      setPending(data.pending || []);
    } catch (e: any) {
      setErr(e.message || "Could not load pending");
      Alert.alert("Error", e.message || "Could not load pending");
    } finally {
      setLoading(false);
    }
  };

  // UNLOCK: verify key by calling pending endpoint once
  const unlock = async () => {
    const key = adminKey.trim();
    if (!key) return Alert.alert("Admin key", "Enter admin key first");

    setErr("");
    setUnlocking(true);

    try {
      const res = await fetch(`${API_BASE}/audio_pending.php`, {
        headers: { [ADMIN_HEADER_KEY]: key },
      });

      const parsed = await fetchJsonSafe(res);
      if (!parsed.ok) {
        throw new Error(
          `Server returned non-JSON.\nHTTP ${res.status}\n\n${parsed.raw.slice(0, 800)}`,
        );
      }

      const data = parsed.json;
      if (!res.ok || !data.ok)
        throw new Error(data.error || "Invalid admin key");

      // success -> unlock and load pending
      setUnlocked(true);
      setPending(data.pending || []);
    } catch (e: any) {
      Alert.alert("Unlock failed", e.message || "Invalid admin key");
    } finally {
      setUnlocking(false);
    }
  };

  const approve = async (id: number) => {
    setErr("");
    const key = adminKey.trim();
    if (!key) return Alert.alert("Admin key", "Enter admin key first");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_approve.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_HEADER_KEY]: key,
        },
        body: JSON.stringify({ id, approved_by: "Admin" }),
      });

      const parsed = await fetchJsonSafe(res);
      if (!parsed.ok) {
        throw new Error(
          `Server returned non-JSON.\nHTTP ${res.status}\n\n${parsed.raw.slice(0, 800)}`,
        );
      }

      const data = parsed.json;
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");

      setPending((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e.message || "Approve failed");
      Alert.alert("Error", e.message || "Approve failed");
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: number) => {
    setErr("");
    const key = adminKey.trim();
    if (!key) return Alert.alert("Admin key", "Enter admin key first");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audio_reject.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_HEADER_KEY]: key,
        },
        body: JSON.stringify({
          id,
          reason: "Rejected",
          approved_by: "Admin",
        }),
      });

      const parsed = await fetchJsonSafe(res);
      if (!parsed.ok) {
        throw new Error(
          `Server returned non-JSON.\nHTTP ${res.status}\n\n${parsed.raw.slice(0, 800)}`,
        );
      }

      const data = parsed.json;
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");

      setPending((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e.message || "Reject failed");
      Alert.alert("Error", e.message || "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  // LOCK AGAIN (hide everything)
  const lockAgain = async () => {
    await stop();
    setMenuOpen(false);
    setUnlocked(false);
    setPending([]);
    setErr("");
    // keep adminKey typed, or wipe it:
    // setAdminKey("");
  };

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const MenuItem = ({
    label,
    onPress,
    danger,
  }: {
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={() => {
        setMenuOpen(false);
        onPress();
      }}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "800",
          color: danger ? "red" : "black",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ✅ LOCK SCREEN ONLY (no menu, no list, nothing)
  if (!unlocked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          padding: 16,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 16,
            gap: 12,
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "900" }}>Admin Locked</Text>
          <Text style={{ opacity: 0.7 }}>
            Enter the admin key to unlock the dashboard.
          </Text>

          <TextInput
            value={adminKey}
            onChangeText={setAdminKey}
            placeholder="Enter ADMIN_KEY"
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              borderRadius: 12,
            }}
          />

          <TouchableOpacity
            onPress={unlock}
            disabled={unlocking}
            style={{
              backgroundColor: "black",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {unlocking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "900" }}>Unlock</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/")}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "900" }}>Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ UNLOCKED UI
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* TOP BAR */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>
            Admin Dashboard
          </Text>
          <Text style={{ opacity: 0.6, marginTop: 2 }}>
            {pending.length} pending upload(s)
          </Text>
        </View>

        {/* 3 DOTS MENU */}
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#eee",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900" }}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <TouchableOpacity
            onPress={loadPending}
            style={{
              backgroundColor: "black",
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "900" }}>Refresh</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={lockAgain}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontWeight: "900" }}>Lock</Text>
          </TouchableOpacity>
        </View>

        {err ? <Text style={{ color: "red" }}>{err}</Text> : null}
      </View>

      <FlatList
        data={pending}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingTop: 10 }}>
              <Text style={{ opacity: 0.7 }}>
                No pending uploads right now.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isPlaying = playingId === item.id;
          return (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                padding: 14,
                borderRadius: 16,
                marginBottom: 10,
                backgroundColor: "white",
              }}
            >
              <Text style={{ fontWeight: "900" }} numberOfLines={2}>
                Hymn {item.hymn_number}: {item.hymn_title}
              </Text>

              <Text style={{ opacity: 0.7, marginTop: 6 }} numberOfLines={2}>
                {item.audio_title || "Audio"} • {item.audio_type.toUpperCase()}{" "}
                • by {item.uploader_name || "Anonymous"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <TouchableOpacity
                  onPress={() => (isPlaying ? stop() : play(item))}
                  style={{
                    backgroundColor: "black",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {isPlaying ? "Stop" : "Play"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => approve(item.id)}
                  style={{
                    backgroundColor: "black",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    Approve
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => reject(item.id)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/hymm",
                      params: { id: String(item.hymn_id) },
                    })
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>Open Hymn</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* MENU MODAL (only appears when UNLOCKED) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 5,
                borderRadius: 999,
                backgroundColor: "#ddd",
                alignSelf: "center",
                marginBottom: 8,
              }}
            />

            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                paddingHorizontal: 14,
                paddingBottom: 8,
              }}
            >
              Admin Menu
            </Text>

            <MenuItem label="Reload Pending" onPress={loadPending} />
            <MenuItem
              label="Upload Hymn Text"
              onPress={() => router.push("/uploadhymm")}
            />
            <MenuItem
              label="Upload Audio"
              onPress={() => router.push("/uploadaudio")}
            />
            <MenuItem
              label="All Hymns (Edit)"
              onPress={() => router.push("/all-hymm")}
            />
            <MenuItem label="Home" onPress={() => router.push("/")} />
            <MenuItem label="Lock dashboard" onPress={lockAgain} danger />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
