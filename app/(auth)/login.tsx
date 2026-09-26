import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { Text, TextInput, View } from "@/components/Themed";
import { supabase } from "@/lib/supabase";

// Supabase Auth always needs an email under the hood. Since this app only
// uses username+password (no real email ever sent), we generate a
// synthetic, never-delivered address from the username instead of asking
// for a real one.
const EMAIL_DOMAIN = "musicratingapp.internal";
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,20}$/;

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedUsername = username.trim();
    setError(null);

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setError("Username must be 3-20 characters: letters, numbers, . _ -");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const email = usernameToEmail(trimmedUsername);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: trimmedUsername } },
      });
      setIsSubmitting(false);
      if (error) {
        setError(
          error.message.toLowerCase().includes("already registered")
            ? "That username is taken."
            : error.message
        );
      }
      // onAuthStateChange in AuthProvider picks up the new session and the
      // root layout redirect handles navigation from here.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setIsSubmitting(false);
      if (error) {
        setError("Incorrect username or password.");
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Rating</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="yourname"
        editable={!isSubmitting}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        editable={!isSubmitting}
      />

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "signup" ? "Sign up" : "Log in"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setMode(mode === "signup" ? "login" : "signup");
          setError(null);
        }}
        disabled={isSubmitting}
      >
        <Text style={styles.link}>
          {mode === "signup"
            ? "Already have an account? Log in"
            : "Don't have an account? Sign up"}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
  error: {
    color: "#e0245e",
    textAlign: "center",
    marginTop: 8,
  },
});
