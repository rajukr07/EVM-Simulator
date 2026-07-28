import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function WelcomeScreen() {
  const handleStartVoting = () => {
    Alert.alert(
      "Voter Verification",
      "The voter verification screen will be implemented next.",
    );
  };

  const handleAdminPortal = () => {
    Alert.alert(
      "Administrator Portal",
      "The administrator authentication screen will be implemented later.",
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>V</Text>
          </View>

          <View>
            <Text style={styles.brandName}>VoteX</Text>
            <Text style={styles.brandSubtitle}>EVM Simulator</Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <View style={styles.badgeIndicator} />
            <Text style={styles.badgeText}>Election system active</Text>
          </View>

          <Text style={styles.title}>
            Secure, simple and transparent voting
          </Text>

          <Text style={styles.description}>
            Experience a modern electronic voting process designed for
            educational and demonstration purposes.
          </Text>
        </View>

        <View style={styles.informationContainer}>
          <View style={styles.informationCard}>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>01</Text>
            </View>

            <View style={styles.informationTextContainer}>
              <Text style={styles.informationTitle}>Verify your identity</Text>

              <Text style={styles.informationDescription}>
                Enter your registered voter ID and secure PIN.
              </Text>
            </View>
          </View>

          <View style={styles.informationCard}>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>02</Text>
            </View>

            <View style={styles.informationTextContainer}>
              <Text style={styles.informationTitle}>Select a candidate</Text>

              <Text style={styles.informationDescription}>
                Review the candidate list and make your selection.
              </Text>
            </View>
          </View>

          <View style={styles.informationCard}>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>03</Text>
            </View>

            <View style={styles.informationTextContainer}>
              <Text style={styles.informationTitle}>Confirm your vote</Text>

              <Text style={styles.informationDescription}>
                Confirm your selection and securely record your vote.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>✓</Text>

          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>One voter, one vote</Text>

            <Text style={styles.securityDescription}>
              Each verified voter can participate only once in an election.
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start voting"
            onPress={handleStartVoting}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Start Voting</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open administrator portal"
            onPress={handleAdminPortal}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Administrator Portal</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          This application is an educational simulation and is not intended for
          use in real elections.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.extraLarge,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.extraLarge,
    backgroundColor: COLORS.primaryDark,
  },

  logoContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.secondary,
  },

  logoText: {
    color: COLORS.primaryDark,
    fontSize: 24,
    fontWeight: "900",
  },

  brandName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  brandSubtitle: {
    marginTop: 2,
    color: "#B7C7D9",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  heroSection: {
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.extraLarge,
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: "#E2F5EC",
  },

  badgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  badgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700",
  },

  title: {
    marginTop: SPACING.large,
    color: COLORS.textPrimary,
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 43,
    letterSpacing: -0.8,
  },

  description: {
    marginTop: SPACING.medium,
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 25,
  },

  informationContainer: {
    gap: 12,
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.extraLarge,
  },

  informationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  numberContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.overlay,
  },

  numberText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  informationTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  informationTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  informationDescription: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  securityNotice: {
    flexDirection: "row",
    marginHorizontal: SPACING.large,
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderRadius: RADIUS.medium,
    backgroundColor: "#E2F5EC",
  },

  securityIcon: {
    width: 28,
    color: COLORS.success,
    fontSize: 22,
    fontWeight: "900",
  },

  securityTextContainer: {
    flex: 1,
  },

  securityTitle: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "800",
  },

  securityDescription: {
    marginTop: 4,
    color: "#34735D",
    fontSize: 13,
    lineHeight: 19,
  },

  actionContainer: {
    gap: 12,
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.extraLarge,
  },

  primaryButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  disclaimer: {
    marginHorizontal: SPACING.large,
    marginTop: SPACING.large,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});
