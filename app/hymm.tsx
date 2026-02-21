// Hymm.tsx
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCachedHymnDetail } from "../utils/offlineSync";
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
  goldLight: "#FBF6E9",
  playing: "#1A1714",
};

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ icon, label }: { icon?: string; label: string }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
    }}
  >
    {icon ? <Text style={{ fontSize: 13 }}>{icon}</Text> : null}
    <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>
      {label}
    </Text>
  </View>
);

// ─── AudioCard ────────────────────────────────────────────────────────────────
const AudioCard = ({
  row,
  isPlaying,
  onPlay,
  onStop,
}: {
  row: AudioRow;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}) => (
  <View
    style={{
      backgroundColor: isPlaying ? C.text : C.surface,
      borderWidth: 1.5,
      borderColor: isPlaying ? C.text : C.border,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      shadowColor: "#1A1714",
      shadowOffset: { width: 0, height: isPlaying ? 4 : 1 },
      shadowOpacity: isPlaying ? 0.14 : 0.04,
      shadowRadius: isPlaying ? 8 : 4,
      elevation: isPlaying ? 3 : 1,
    }}
  >
    <TouchableOpacity
      onPress={isPlaying ? onStop : onPlay}
      activeOpacity={0.75}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: isPlaying ? C.surface : C.text,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 18, color: isPlaying ? C.text : C.surface }}>
        {isPlaying ? "⏹" : "▶"}
      </Text>
    </TouchableOpacity>

    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontWeight: "800",
          fontSize: 14,
          color: isPlaying ? C.surface : C.text,
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {row.audio_title || "Audio Recording"}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
        }}
      >
        <View
          style={{
            backgroundColor: isPlaying
              ? "rgba(255,255,255,0.15)"
              : C.accentLight,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: isPlaying ? C.surface : C.accent,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {row.audio_type}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 12,
            color: isPlaying ? "rgba(255,255,255,0.6)" : C.textSub,
          }}
          numberOfLines={1}
        >
          {row.uploader_name || "Anonymous"}
        </Text>
      </View>
    </View>

    {isPlaying && (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          paddingRight: 4,
        }}
      >
        {[10, 16, 12, 18, 8].map((h, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: h,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.55)",
            }}
          />
        ))}
      </View>
    )}
  </View>
);

// ─── MenuItem ─────────────────────────────────────────────────────────────────
const MenuItem = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.65}
    onPress={onPress}
    style={{
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: C.accentLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
    </View>
    <Text
      style={{
        fontSize: 15,
        fontWeight: "600",
        color: C.text,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Hymm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [audios, setAudios] = useState<AudioRow[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadFromCache = async () => {
    if (!id) return;
    try {
      const cached = await getCachedHymnDetail(id);
      if (cached) {
        setHymn(cached.hymn);
        setAudios(cached.audios);
      }
    } catch (e) {
      console.warn("Failed to load hymn detail from cache", e);
    }
  };

  const fetchFresh = async (silent = false) => {
    if (!id) return;
    if (!silent && firstLoad) {
      setLoading(true);
    }
    setErr("");

    try {
      const res = await fetch(
        `${API_BASE}/hymn_get.php?id=${encodeURIComponent(String(id || ""))}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");

      setHymn(data.hymn);
      setAudios(data.audios || []);

      if (firstLoad) setFirstLoad(false);
    } catch (e: any) {
      if (!silent) {
        setErr(
          e.message?.includes("fetch")
            ? "No internet. Showing last saved version."
            : e.message || "Failed to load hymn",
        );
      }
      console.warn("Fetch error:", e);
    } finally {
      if (!silent && firstLoad) setLoading(false);
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
        if (status.didJustFinish) {
          stopAudio();
        }
      });
    } catch (e: any) {
      setErr(e.message || "Could not play audio");
    }
  };

  // Initial load: cache → fresh
  useEffect(() => {
    (async () => {
      await loadFromCache();
      await fetchFresh();
      setFirstLoad(false);
    })();

    return () => {
      stopAudio();
    };
  }, [id]);

  const handleRefresh = () => {
    fetchFresh();
  };

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
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 18, color: C.text }}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: C.text,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {hymn ? `${hymn.hymn_number}. ${hymn.title}` : "Hymn"}
          </Text>
          <Text
            style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}
            numberOfLines={1}
          >
            {hymn?.theme ? hymn.theme : "Text & audio versions"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
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
            flexShrink: 0,
          }}
        >
          <View style={{ gap: 4, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: i === 1 ? 12 : 16,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: C.text,
                }}
              />
            ))}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && firstLoad ? (
          <View style={{ paddingTop: 40, alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={C.accent} />
            <Text style={{ fontSize: 13, color: C.textSub }}>
              Loading hymn…
            </Text>
          </View>
        ) : null}

        {err ? (
          <View
            style={{
              backgroundColor: "#FEF0EF",
              borderWidth: 1,
              borderColor: "#F5C6C2",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 13, color: C.danger, flex: 1 }}>
              {err}
            </Text>
          </View>
        ) : null}

        {hymn && (
          <View style={{ gap: 14 }}>
            {/* ── CHIPS ──────────────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Chip label={`Hymn ${hymn.hymn_number}`} />
              {hymn.scripture_ref && (
                <Chip icon="📖" label={hymn.scripture_ref} />
              )}
              {hymn.theme && <Chip icon="🏷" label={hymn.theme} />}
            </View>

            {/* ── LYRICS CARD ────────────────────────────────────────────── */}
            <View
              style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 18,
                overflow: "hidden",
                shadowColor: "#1A1714",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: C.accentLight,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#DDD0C0",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 18 }}>♪</Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "900",
                    color: C.accentDark,
                    flex: 1,
                    letterSpacing: -0.3,
                  }}
                >
                  {hymn.title}
                </Text>
              </View>

              <View style={{ padding: 18 }}>
                <Text
                  style={{
                    fontSize: 15,
                    lineHeight: 27,
                    color: C.text,
                    letterSpacing: 0.1,
                  }}
                >
                  {hymn.lyrics}
                </Text>
              </View>
            </View>

            {/* ── AUDIO SECTION ──────────────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "900",
                    color: C.text,
                    letterSpacing: -0.3,
                  }}
                >
                  Audio Versions
                </Text>
                <Text style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
                  {audios.length} approved recording
                  {audios.length !== 1 ? "s" : ""}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/uploadaudio",
                    params: { hymn_id: String(hymn.id) },
                  })
                }
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: C.text,
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 11,
                }}
              >
                <Text style={{ fontSize: 14, color: C.surface }}>🎙</Text>
                <Text
                  style={{ color: C.surface, fontWeight: "800", fontSize: 13 }}
                >
                  Upload
                </Text>
              </TouchableOpacity>
            </View>

            {/* Refresh button for audio section */}
            <TouchableOpacity
              onPress={handleRefresh}
              activeOpacity={0.7}
              style={{
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: C.border,
              }}
            >
              <Text style={{ fontSize: 14, color: C.textSub }}>
                ↻ Refresh audios
              </Text>
            </TouchableOpacity>

            {/* ── EMPTY AUDIO ────────────────────────────────────────────── */}
            {audios.length === 0 && (
              <View
                style={{
                  backgroundColor: C.goldLight,
                  borderWidth: 1,
                  borderColor: "#E8D89A",
                  borderRadius: 18,
                  padding: 20,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 32 }}>🎵</Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: C.text,
                    textAlign: "center",
                  }}
                >
                  No recordings yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: C.textSub,
                    textAlign: "center",
                    lineHeight: 20,
                    maxWidth: 240,
                  }}
                >
                  Be the first to share your voice for this hymn.
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/uploadaudio",
                      params: { hymn_id: String(hymn.id) },
                    })
                  }
                  activeOpacity={0.8}
                  style={{
                    marginTop: 4,
                    backgroundColor: C.text,
                    paddingVertical: 12,
                    paddingHorizontal: 28,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: C.surface,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    Upload your version
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── AUDIO LIST ─────────────────────────────────────────────── */}
            {audios.map((a) => (
              <AudioCard
                key={a.id}
                row={a}
                isPlaying={playingId === a.id}
                onPlay={() => playAudio(a)}
                onStop={stopAudio}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── BOTTOM SHEET MENU ──────────────────────────────────────────────── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(26,23,20,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingBottom: 20,
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: C.border,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>♪</Text>
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: C.text,
                    letterSpacing: -0.3,
                  }}
                >
                  Hymn {hymn?.hymn_number}
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}
                  numberOfLines={1}
                >
                  {hymn?.title}
                </Text>
              </View>
            </View>

            <MenuItem
              icon="🎙️"
              label="Upload audio for this hymn"
              onPress={() => {
                setMenuOpen(false);
                router.push({
                  pathname: "/uploadaudio",
                  params: { hymn_id: String(hymn?.id || "") },
                });
              }}
            />
            <MenuItem
              icon="✏️"
              label="Edit hymn text"
              onPress={() => {
                setMenuOpen(false);
                router.push({
                  pathname: "/edithymm",
                  params: { id: String(hymn?.id || "") },
                });
              }}
            />
            <MenuItem
              icon="🏠"
              label="Back to home"
              onPress={() => {
                setMenuOpen(false);
                router.push("/");
              }}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMenuOpen(false)}
              style={{
                margin: 20,
                marginBottom: 0,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: C.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: C.textSub }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
