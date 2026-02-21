import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE } from "./config";

type HymnRow = { id: number; hymn_number: number; title: string };

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

const AUDIO_TYPES = ["spoken", "sung", "instrumental", "other"] as const;
type AudioType = (typeof AUDIO_TYPES)[number];

const TYPE_META: Record<AudioType, { icon: string; label: string }> = {
  spoken: { icon: "🗣", label: "Spoken" },
  sung: { icon: "🎵", label: "Sung" },
  instrumental: { icon: "🎸", label: "Instrumental" },
  other: { icon: "◎", label: "Other" },
};

// Shared input style
function useInputFocus() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    borderColor: focused ? C.accent : C.border,
  };
}

const SectionCard = ({
  icon,
  title,
  badge,
  children,
}: {
  icon: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#1A1714",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: C.accentLight,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#DDD0C0",
      }}
    >
      <Text style={{ fontSize: 15 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C.accentDark,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {badge && (
        <View
          style={{
            marginLeft: 4,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: "#DDD0C0",
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 10, color: C.accent, fontWeight: "700" }}>
            {badge}
          </Text>
        </View>
      )}
    </View>
    <View style={{ padding: 16 }}>{children}</View>
  </View>
);

function StyledTextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderColor: focused ? C.accent : C.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: C.text,
      }}
    />
  );
}

export default function UploadAudio() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hymn_id?: string }>();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [hymns, setHymns] = useState<HymnRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedHymn, setSelectedHymn] = useState<HymnRow | null>(null);

  const [uploaderName, setUploaderName] = useState("");
  const [uploaderPhone, setUploaderPhone] = useState("");
  const [uploaderLocation, setUploaderLocation] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [audioType, setAudioType] = useState<AudioType>("spoken");

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
      // @ts-ignore
      form.append("file", {
        uri: file.uri,
        name: file.name || "audio.mp3",
        type: safeType,
      });
      const res = await fetch(`${API_BASE}/audio_upload.php`, {
        method: "POST",
        body: form,
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
      Alert.alert("Submitted!", "Your audio is waiting for approval.");
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
  }, [listUrl]);

  useEffect(() => {
    const hid = params.hymn_id ? parseInt(params.hymn_id, 10) : 0;
    if (!hid) return;
    const found = hymns.find((h) => h.id === hid);
    if (found) setSelectedHymn(found);
  }, [params.hymn_id, hymns]);

  const readyToSubmit = !!selectedHymn && !!file;

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
              fontSize: 20,
              fontWeight: "900",
              color: C.text,
              letterSpacing: -0.5,
            }}
          >
            Upload Audio
          </Text>
          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}>
            Submit a recording for approval
          </Text>
        </View>

        {/* Readiness indicator */}
        <View
          style={{
            backgroundColor: readyToSubmit ? "#E8F5EE" : C.accentLight,
            borderWidth: 1,
            borderColor: readyToSubmit ? "#A8D5B8" : "#DDD0C0",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: readyToSubmit ? "#1A6B3C" : C.accent,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {readyToSubmit ? "● Ready" : "Setup"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 16 }}>
          {/* HYMN SELECTION */}
          <SectionCard icon="♪" title="Select Hymn">
            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.bg,
                borderWidth: 1.5,
                borderColor: searchFocused ? C.accent : C.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: C.textMuted }}>🔍</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by title or number…"
                placeholderTextColor={C.textMuted}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: C.text,
                  paddingVertical: 11,
                }}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, color: C.textMuted }}>✕</Text>
                </TouchableOpacity>
              )}
              {loadingList && (
                <ActivityIndicator size="small" color={C.accent} />
              )}
            </View>

            {/* Hymn list */}
            <FlatList
              data={hymns}
              keyExtractor={(i) => String(i.id)}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const active = selectedHymn?.id === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedHymn(item)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      borderWidth: 1.5,
                      borderColor: active ? C.accent : C.border,
                      backgroundColor: active ? C.accentLight : C.surface,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: active ? C.accent : C.bg,
                        borderWidth: 1,
                        borderColor: active ? C.accent : C.border,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: active ? C.surface : C.textSub,
                        }}
                      >
                        {item.hymn_number}
                      </Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: "700",
                        color: active ? C.accentDark : C.text,
                      }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {active && (
                      <Text style={{ fontSize: 16, color: C.accent }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                !loadingList ? (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, color: C.textMuted }}>
                      No hymns found
                    </Text>
                  </View>
                ) : null
              }
            />

            {/* Selected banner */}
            {selectedHymn && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: C.accentLight,
                  borderWidth: 1,
                  borderColor: "#DDD0C0",
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 16 }}>✓</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: C.accentDark,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {selectedHymn.hymn_number}. {selectedHymn.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedHymn(null)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, color: C.textSub }}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {/* AUDIO TYPE */}
          <SectionCard icon="🎙" title="Recording Type">
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {AUDIO_TYPES.map((t) => {
                const active = audioType === t;
                const meta = TYPE_META[t];
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setAudioType(t)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: active ? C.text : C.bg,
                      borderWidth: 1.5,
                      borderColor: active ? C.text : C.border,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: active ? C.surface : C.text,
                        letterSpacing: 0.2,
                      }}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* AUDIO FILE */}
          <SectionCard icon="📁" title="Audio File">
            <TouchableOpacity
              onPress={pickAudio}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: file ? C.accent : C.border,
                borderStyle: file ? "solid" : "dashed",
                borderRadius: 14,
                padding: 20,
                alignItems: "center",
                gap: 8,
                backgroundColor: file ? C.accentLight : C.bg,
              }}
            >
              <Text style={{ fontSize: 28 }}>{file ? "🎵" : "📂"}</Text>
              {file ? (
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: C.accentDark,
                      textAlign: "center",
                    }}
                  >
                    {file.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.accent }}>
                    Tap to change file
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: C.text }}
                  >
                    Tap to pick audio file
                  </Text>
                  <Text style={{ fontSize: 12, color: C.textSub }}>
                    MP3, M4A, WAV, AAC supported
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </SectionCard>

          {/* UPLOADER DETAILS */}
          <SectionCard icon="👤" title="Your Details" badge="Optional">
            <View style={{ gap: 12 }}>
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textSub,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Name
                </Text>
                <StyledTextInput
                  value={uploaderName}
                  onChangeText={setUploaderName}
                  placeholder="Your name"
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textSub,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Phone
                </Text>
                <StyledTextInput
                  value={uploaderPhone}
                  onChangeText={setUploaderPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textSub,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Church / Location
                </Text>
                <StyledTextInput
                  value={uploaderLocation}
                  onChangeText={setUploaderLocation}
                  placeholder="e.g. St. Paul's Church, Maiduguri"
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textSub,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Recording Title
                </Text>
                <StyledTextInput
                  value={audioTitle}
                  onChangeText={setAudioTitle}
                  placeholder="e.g. Choir version, Sunday service"
                />
              </View>
            </View>
          </SectionCard>

          {/* SUBMIT */}
          <TouchableOpacity
            onPress={upload}
            disabled={uploading || !readyToSubmit}
            activeOpacity={0.8}
            style={{
              backgroundColor: uploading
                ? C.textSub
                : readyToSubmit
                  ? C.text
                  : C.borderStrong,
              paddingVertical: 16,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: C.text,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: readyToSubmit && !uploading ? 0.18 : 0,
              shadowRadius: 10,
              elevation: readyToSubmit && !uploading ? 3 : 0,
            }}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text
                  style={{ color: "white", fontWeight: "800", fontSize: 15 }}
                >
                  Uploading…
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>📤</Text>
                <Text
                  style={{
                    color: readyToSubmit ? "white" : C.textSub,
                    fontWeight: "800",
                    fontSize: 15,
                    letterSpacing: 0.2,
                  }}
                >
                  Submit for Approval
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!readyToSubmit && (
            <Text
              style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}
            >
              Select a hymn and audio file to continue
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
