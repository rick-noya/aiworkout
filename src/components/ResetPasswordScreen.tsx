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

export default function ResetPasswordScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const theme = useTheme();

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setSuccess(true);
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
          Reset Password
        </Text>
        {success ? (
          <>
            <Text
              style={{
                color: theme.colors.primary,
                textAlign: "center",
                marginVertical: 16,
              }}
            >
              Your password has been reset. You can now log in with your new
              password.
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 16 }}
              onPress={() => navigation.replace("Auth")}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <TextInput
              label="New Password"
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
            <TextInput
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
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
              onPress={handleReset}
              loading={loading}
              disabled={!password || !confirm || loading}
              style={{ marginTop: 16 }}
            >
              Reset Password
            </Button>
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
