import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
  useTheme,
} from "react-native-paper";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const theme = useTheme();

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      if (!error && data && data.user && !data.session) {
        setConfirmationSent(true);
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) setError(error.message);
    else setResetSent(true);
    setLoading(false);
  };

  return (
    <View style={styles.outerContainer}>
      <Surface
        style={[
          styles.surface,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
        elevation={4}
      >
        <Text
          variant="titleLarge"
          style={{ marginBottom: 16, color: theme.colors.onSurface }}
        >
          {isLogin ? "Login" : "Create Account"}
        </Text>
        {confirmationSent ? (
          <>
            <Text
              style={{
                color: theme.colors.primary,
                textAlign: "center",
                marginVertical: 16,
              }}
            >
              A confirmation email has been sent to {email}. Please check your
              inbox and confirm your email to continue.
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 16 }}
              onPress={() => {
                setIsLogin(true);
                setConfirmationSent(false);
                setEmail("");
                setPassword("");
              }}
            >
              Back to Login
            </Button>
          </>
        ) : showReset ? (
          <>
            <Text
              style={{
                color: theme.colors.primary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Enter your email to reset your password
            </Text>
            <TextInput
              label="Email"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="flat"
              theme={{
                colors: {
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                },
              }}
              editable={!loading}
            />
            {resetSent && (
              <Text
                style={{
                  color: theme.colors.primary,
                  textAlign: "center",
                  marginVertical: 8,
                }}
              >
                If an account exists for {resetEmail}, a password reset email
                has been sent.
              </Text>
            )}
            {error && <HelperText type="error">{error}</HelperText>}
            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={!resetEmail || loading}
              style={{ marginTop: 16 }}
            >
              Send Reset Email
            </Button>
            <Button
              mode="text"
              onPress={() => {
                setShowReset(false);
                setResetEmail("");
                setResetSent(false);
                setError(null);
              }}
              style={{ marginTop: 8 }}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="flat"
              theme={{
                colors: {
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                },
              }}
              editable={!loading}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="flat"
              theme={{
                colors: {
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                },
              }}
              editable={!loading}
            />
            {error && <HelperText type="error">{error}</HelperText>}
            <Button
              mode="contained"
              onPress={handleAuth}
              loading={loading}
              disabled={!email || !password || loading}
              style={{ marginTop: 16 }}
            >
              {isLogin ? "Login" : "Sign Up"}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsLogin(!isLogin)}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {isLogin
                ? "Need an account? Sign Up"
                : "Already have an account? Login"}
            </Button>
            {isLogin && (
              <Button
                mode="text"
                onPress={() => {
                  setShowReset(true);
                  setResetEmail("");
                  setResetSent(false);
                  setError(null);
                }}
                style={{ marginTop: 8 }}
              >
                Forgot password?
              </Button>
            )}
          </>
        )}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#181818",
  },
  surface: {
    width: 340,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
  },
  input: {
    width: 260,
    marginVertical: 8,
    backgroundColor: "#232323",
    color: "#fff",
  },
});
