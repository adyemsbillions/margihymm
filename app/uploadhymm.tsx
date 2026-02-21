import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE } from "./config";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#E8E2D9",
  borderStrong: "#C8BFB0",
  borderFocus: "#8B5E3C",
  text: "#1A1714",
  textSub: "#7A7168",
  textMuted: "#A89F94",
  accent: "#8B5E3C",
  accentLight: "#F2EBE3",
  accentDark: "#5C3D24",
  danger: "#C0392B",
  gold: "#C9A84C",
};

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({
  label,
  optional,
  icon,
  children,
}: {
  label: string;
  optional?: boolean;
  icon: string;
  children: React.ReactNode;
}) => (
  <View style={{ gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: C.text,
          letterSpacing: 0.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      {optional && (
        <View
          style={{
            backgroundColor: C.accentLight,
            borderWidth: 1,
            borderColor: "#DDD0C0",
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 20,
            marginLeft: 2,
          }}
        >
          <Text style={{ fontSize: 10, color: C.accent, fontWeight: "700" }}>
            Optional
          </Text>
        </View>
      )}
    </View>
    {children}
  </View>
);

// ─── StyledInput ──────────────────────────────────────────────────────────────
const StyledInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  minHeight,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  minHeight?: number;
}) => {
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
      textAlignVertical={multiline ? "top" : undefined}
      style={{
        backgroundColor: C.surface,
        borderWidth: 1.5,
        borderColor: focused ? C.borderFocus : C.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: C.text,
        lineHeight: multiline ? 24 : undefined,
        minHeight: minHeight,
      }}
    />
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
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
    if (!title.trim()) return Alert.alert("Error", "Enter a title");
    if (!lyrics.trim()) return Alert.alert("Error", "Enter the lyrics");

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

  const filled = [hymnNumber, title, lyrics].filter(Boolean).length;
  const progress = Math.round((filled / 3) * 100);

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
            Upload Hymn
          </Text>
          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}>
            Add a new hymn text to the library
          </Text>
        </View>

        {/* Progress pill */}
        <View
          style={{
            backgroundColor: progress === 100 ? C.accentLight : C.surface,
            borderWidth: 1,
            borderColor: progress === 100 ? "#DDD0C0" : C.border,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: progress === 100 ? C.accent : C.textMuted,
              letterSpacing: 0.3,
            }}
          >
            {progress}%
          </Text>
        </View>
      </View>

      {/* ── FORM ───────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 20 }}>
          {/* ── Section: Identity ────────────────────────────────────────── */}
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
            {/* Section header */}
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
              <Text style={{ fontSize: 15 }}>📋</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: C.accentDark,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Hymn Identity
              </Text>
            </View>

            <View style={{ padding: 16, gap: 16 }}>
              <Field label="Hymn Number" icon="🔢">
                <StyledInput
                  value={hymnNumber}
                  onChangeText={setHymnNumber}
                  placeholder="e.g. 12"
                  keyboardType="number-pad"
                />
              </Field>

              <Field label="Title" icon="🏷">
                <StyledInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Full hymn title"
                />
              </Field>
            </View>
          </View>

          {/* ── Section: Metadata ────────────────────────────────────────── */}
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
              <Text style={{ fontSize: 15 }}>✨</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: C.accentDark,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Metadata
              </Text>
              <View
                style={{
                  marginLeft: 4,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#DDD0C0",
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ fontSize: 10, color: C.accent, fontWeight: "700" }}
                >
                  Optional
                </Text>
              </View>
            </View>

            <View style={{ padding: 16, gap: 16 }}>
              <Field label="Theme" icon="🎨" optional>
                <StyledInput
                  value={theme}
                  onChangeText={setTheme}
                  placeholder="e.g. Praise, Worship, Salvation"
                />
              </Field>

              <Field label="Scripture Reference" icon="📖" optional>
                <StyledInput
                  value={scriptureRef}
                  onChangeText={setScriptureRef}
                  placeholder="e.g. Psalm 23:1"
                />
              </Field>
            </View>
          </View>

          {/* ── Section: Lyrics ──────────────────────────────────────────── */}
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
              <Text style={{ fontSize: 15 }}>♪</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: C.accentDark,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Lyrics
              </Text>
              {lyrics.trim().length > 0 && (
                <Text
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: C.textSub,
                    fontWeight: "600",
                  }}
                >
                  {lyrics.trim().split("\n").length} lines
                </Text>
              )}
            </View>

            <View style={{ padding: 16 }}>
              <StyledInput
                value={lyrics}
                onChangeText={setLyrics}
                placeholder={
                  "Paste or type the full hymn lyrics here…\n\nVerse 1\n…\n\nChorus\n…"
                }
                multiline
                minHeight={240}
              />
            </View>
          </View>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: loading ? C.textSub : C.text,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              shadowColor: C.text,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: loading ? 0 : 0.18,
              shadowRadius: 10,
              elevation: loading ? 0 : 3,
            }}
          >
            {loading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text
                  style={{ color: "white", fontSize: 15, fontWeight: "800" }}
                >
                  Saving…
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>📤</Text>
                <Text
                  style={{
                    color: "white",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: 0.2,
                  }}
                >
                  Submit Hymn
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 12,
              color: C.textMuted,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            The hymn will be visible in the library immediately after
            submission.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
