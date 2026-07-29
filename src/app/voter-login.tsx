import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
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
import { DEMO_VOTERS } from "../data/voters";

export default function VoterLoginScreen() {
  const router = useRouter();

  const [voterId, setVoterId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleVoterIdChange = (value: string) => {
    setVoterId(value.toUpperCase());

    if (error) {
      setError("");
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value.replace(/[^0-9]/g, ""));

    if (error) {
      setError("");
    }
  };

  const handleVerification = () => {
    const normalizedVoterId = voterId.trim().toUpperCase();
    const normalizedPin = pin.trim();

    if (!normalizedVoterId || !normalizedPin) {
      setError("Please enter your voter ID and PIN.");
      return;
    }

    if (normalizedPin.length !== 4) {
      setError("The voter PIN must contain exactly four digits.");
      return;
    }

    const voter = DEMO_VOTERS.find(
      (item) => item.id === normalizedVoterId && item.pin === normalizedPin,
    );

    if (!voter) {
      setError("The voter ID or PIN is incorrect.");
      return;
    }

    if (voter.hasVoted) {
      setError("This voter has already participated in the election.");
      return;
    }

    setError("");

    Alert.alert(
      "Verification Successful",
      `Welcome, ${voter.name}. Your identity has been verified.`,
      [
        {
          text: "Continue",
          onPress: () => {
            // Navigation to the ballot screen will be added next.
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
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
              accessibilityLabel="Return to welcome screen"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Voter Verification</Text>

              <Text style={styles.headerSubtitle}>
                Verify your eligibility before accessing the ballot.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP 1 OF 3</Text>
            </View>

            <Text style={styles.title}>Confirm your identity</Text>

            <Text style={styles.description}>
              Enter the voter ID and four-digit PIN assigned to your
              demonstration account.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voter ID</Text>

                <TextInput
                  value={voterId}
                  onChangeText={handleVoterIdChange}
                  placeholder="Example: VOTER001"
                  placeholderTextColor="#98A3B3"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Secure PIN</Text>

                <TextInput
                  value={pin}
                  onChangeText={handlePinChange}
                  placeholder="Enter your four-digit PIN"
                  placeholderTextColor="#98A3B3"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  style={styles.input}
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>
                    Verification unsuccessful
                  </Text>

                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify voter identity"
                onPress={handleVerification}
                style={({ pressed }) => [
                  styles.verifyButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.verifyButtonText}>Verify and Continue</Text>
              </Pressable>
            </View>

            <View style={styles.demoCard}>
              <Text style={styles.demoTitle}>Demonstration Account</Text>

              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Voter ID</Text>
                <Text style={styles.credentialValue}>VOTER001</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>PIN</Text>
                <Text style={styles.credentialValue}>1234</Text>
              </View>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Privacy notice</Text>

              <Text style={styles.noticeText}>
                Voter verification and ballot selection will remain separate to
                preserve ballot privacy in this simulation.
              </Text>
            </View>
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

  keyboardContainer: {
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

  formSection: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.extraLarge,
    paddingBottom: SPACING.extraLarge,
  },

  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: COLORS.overlay,
  },

  stepBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  title: {
    marginTop: SPACING.medium,
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
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

  verifyButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
  },

  verifyButtonText: {
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
    alignItems: "center",
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
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: COLORS.border,
  },

  notice: {
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderRadius: RADIUS.medium,
    backgroundColor: "#E2F5EC",
  },

  noticeTitle: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "800",
  },

  noticeText: {
    marginTop: 5,
    color: "#34735D",
    fontSize: 13,
    lineHeight: 20,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
