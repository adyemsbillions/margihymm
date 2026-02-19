import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
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

type AudioRow = {
  id: number;
  audio_title?: string | null;
  audio_type: string;
  uploader_name?: string | null;
  submitted_at: string;
  audio_url: string;
};

export default function Hymm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [audios, setAudios] = useState<AudioRow[]>([]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/hymn_get.php?id=${encodeURIComponent(String(id || ""))}`,
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setHymn(data.hymn);
      setAudios(data.audios || []);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
    } catch {}
    soundRef.current = null;
    setPlayingId(null);
  };

  const playAudio = async (row: AudioRow) => {
    await stopAudio();
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: row.audio_url },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlayingId(row.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        // @ts-ignore
        if (status?.didJustFinish) stopAudio();
      });
    } catch (e: any) {
      setErr(e.message || "Could not play audio");
    }
  };

  useEffect(() => {
    load();
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const MenuItem = ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
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
      <Text style={{ fontSize: 16, fontWeight: "800" }}>{label}</Text>
    </TouchableOpacity>
  );

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
          <Text style={{ fontSize: 16, fontWeight: "900" }} numberOfLines={1}>
            {hymn ? `${hymn.hymn_number}. ${hymn.title}` : "Hymn"}
          </Text>
          <Text style={{ opacity: 0.6, marginTop: 2 }} numberOfLines={1}>
            {hymn?.theme ? `Theme: ${hymn.theme}` : "Text + audio versions"}
          </Text>
        </View>

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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? <ActivityIndicator /> : null}
        {err ? (
          <Text style={{ color: "red", marginBottom: 10 }}>{err}</Text>
        ) : null}

        {hymn ? (
          <View style={{ gap: 12 }}>
            {/* INFO CHIPS */}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontWeight: "800" }}>
                  Hymn {hymn.hymn_number}
                </Text>
              </View>

              {hymn.scripture_ref ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#eee",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontWeight: "700" }} numberOfLines={1}>
                    📖 {hymn.scripture_ref}
                  </Text>
                </View>
              ) : null}

              {hymn.theme ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#eee",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontWeight: "700" }} numberOfLines={1}>
                    🏷 {hymn.theme}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* LYRICS CARD */}
            <View
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 16,
                padding: 14,
                backgroundColor: "white",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "900" }}>
                {hymn.title}
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#eee",
                  marginVertical: 10,
                }}
              />
              <Text style={{ lineHeight: 24, fontSize: 15 }}>
                {hymn.lyrics}
              </Text>
            </View>

            {/* AUDIO HEADER */}
            <View
              style={{
                marginTop: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900" }}>
                  Audio Versions
                </Text>
                <Text style={{ opacity: 0.6, marginTop: 2 }}>
                  {audios.length} approved
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/uploadaudio",
                    params: { hymn_id: String(hymn.id) },
                  })
                }
                style={{
                  backgroundColor: "black",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>
                  Upload audio
                </Text>
              </TouchableOpacity>
            </View>

            {/* AUDIO LIST */}
            {audios.length === 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <Text style={{ fontWeight: "800" }}>No approved audio yet</Text>
                <Text style={{ opacity: 0.7, marginTop: 6 }}>
                  Be the first to upload a real voice version for this hymn.
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/uploadaudio",
                      params: { hymn_id: String(hymn.id) },
                    })
                  }
                  style={{
                    backgroundColor: "black",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800" }}>
                    Upload your version
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {audios.map((a) => {
              const isPlaying = playingId === a.id;
              return (
                <View
                  key={a.id}
                  style={{
                    borderWidth: 1,
                    borderColor: "#eee",
                    padding: 14,
                    borderRadius: 16,
                    marginTop: 10,
                    backgroundColor: "white",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "900" }} numberOfLines={1}>
                        {a.audio_title ? a.audio_title : "Audio"} •{" "}
                        {a.audio_type.toUpperCase()}
                      </Text>
                      <Text
                        style={{ opacity: 0.7, marginTop: 4 }}
                        numberOfLines={1}
                      >
                        By {a.uploader_name ? a.uploader_name : "Anonymous"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => (isPlaying ? stopAudio() : playAudio(a))}
                      style={{
                        backgroundColor: "black",
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "900" }}>
                        {isPlaying ? "Stop" : "Play"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* 3 DOTS MENU MODAL */}
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
              Hymn Menu
            </Text>

            <MenuItem
              label="Upload audio for this hymn"
              onPress={() =>
                router.push({
                  pathname: "/uploadaudio",
                  params: { hymn_id: String(hymn?.id || "") },
                })
              }
            />

            <MenuItem
              label="Edit hymn text"
              onPress={() =>
                router.push({
                  pathname: "/edithymm",
                  params: { id: String(hymn?.id || "") },
                })
              }
            />

            <MenuItem label="Back to home" onPress={() => router.push("/")} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
