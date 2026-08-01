import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export default function AdminLoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername || !password.trim()) {
      setError("Please enter the administrator username and password.");
      return;
    }

    if (normalizedUsername !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError("The administrator credentials are incorrect.");
      return;
    }

    setError("");

    router.replace({
      pathname: "/admin-dashboard",
      params: {
        authenticated: "true",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to home screen"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Administrator Portal</Text>

              <Text style={styles.headerSubtitle}>
                Authorized election management access only.
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.adminIcon}>
              <Text style={styles.adminIconText}>A</Text>
            </View>

            <Text style={styles.title}>Administrator sign in</Text>

            <Text style={styles.description}>
              Sign in to view election results and manage simulator data.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>

                <TextInput
                  value={username}
                  onChangeText={(value) => {
                    setUsername(value);

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter administrator username"
                  placeholderTextColor="#98A3B3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>

                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter administrator password"
                  placeholderTextColor="#98A3B3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                  style={styles.input}
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Login unsuccessful</Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in as administrator"
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </Pressable>
            </View>

            <View style={styles.demoCard}>
              <Text style={styles.demoTitle}>Demonstration Credentials</Text>

              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Username</Text>
                <Text style={styles.credentialValue}>admin</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue}>admin123</Text>
              </View>
            </View>

            <Text style={styles.warning}>
              These credentials are intended only for this educational
              simulator.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.extraLarge,
    backgroundColor: COLORS.primaryDark,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#36516D",
    borderRadius: RADIUS.medium,
    backgroundColor: "#17324F",
  },

  backButtonText: {
    marginTop: -4,
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "300",
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 7,
    color: "#B7C7D9",
    fontSize: 14,
    lineHeight: 21,
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.extraLarge,
    paddingBottom: SPACING.extraLarge,
  },

  adminIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: COLORS.primary,
  },

  adminIconText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "900",
  },

  title: {
    marginTop: SPACING.large,
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
  },

  description: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },

  form: {
    gap: SPACING.medium,
    marginTop: SPACING.extraLarge,
  },

  inputGroup: {
    gap: 8,
  },

  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  input: {
    minHeight: 56,
    paddingHorizontal: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontSize: 16,
  },

  errorContainer: {
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: "#F1B7B7",
    borderRadius: RADIUS.medium,
    backgroundColor: "#FFF0F0",
  },

  errorTitle: {
    color: "#A72D2D",
    fontSize: 13,
    fontWeight: "800",
  },

  errorMessage: {
    marginTop: 4,
    color: "#A72D2D",
    fontSize: 13,
    lineHeight: 19,
  },

  loginButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  demoCard: {
    marginTop: SPACING.extraLarge,
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  demoTitle: {
    marginBottom: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },

  credentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  credentialLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  credentialValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: COLORS.border,
  },

  warning: {
    marginTop: SPACING.large,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
