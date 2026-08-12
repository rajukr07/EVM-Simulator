import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { CANDIDATES } from "../data/candidates";
import {
    getVoteCounts,
    resetElectionData,
    type VoteCounts,
} from "../services/electionStorage";

export default function AdminDashboardScreen() {
  const router = useRouter();

  const { authenticated } = useLocalSearchParams<{
    authenticated?: string;
  }>();

  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const totalVotes = Object.values(voteCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const loadResults = useCallback(async () => {
    setIsLoading(true);

    try {
      const results = await getVoteCounts();
      setVoteCounts(results);
    } catch {
      Alert.alert(
        "Unable to Load Results",
        "Election results could not be loaded. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authenticated !== "true") {
        router.replace("/admin-login");
        return;
      }

      loadResults();
    }, [authenticated, loadResults, router]),
  );

  const handleResetElection = () => {
    Alert.alert(
      "Reset Election Data",
      "This will permanently remove all locally recorded votes and allow every demonstration voter to vote again.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset Data",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);

            try {
              await resetElectionData();
              setVoteCounts({});

              Alert.alert(
                "Election Reset",
                "All locally recorded election data has been removed.",
              );
            } catch {
              Alert.alert(
                "Reset Unsuccessful",
                "Election data could not be reset. Please try again.",
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    router.replace("/");
  };

  if (authenticated !== "true") {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Election Dashboard</Text>

            <Text style={styles.headerSubtitle}>
              Review locally recorded simulator results.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL VOTES RECORDED</Text>
            <Text style={styles.summaryValue}>{totalVotes}</Text>
            <Text style={styles.summaryDescription}>
              Votes stored on this device
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Candidate Results</Text>

              <Text style={styles.sectionSubtitle}>
                Current vote distribution
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh election results"
              disabled={isLoading}
              onPress={loadResults}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading results...</Text>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {CANDIDATES.map((candidate) => {
                const candidateVotes = voteCounts[candidate.id] ?? 0;

                const percentage =
                  totalVotes > 0
                    ? Math.round((candidateVotes / totalVotes) * 100)
                    : 0;

                return (
                  <View key={candidate.id} style={styles.resultCard}>
                    <View style={styles.resultTopRow}>
                      <View style={styles.symbolContainer}>
                        <Text style={styles.symbolText}>
                          {candidate.symbol}
                        </Text>
                      </View>

                      <View style={styles.candidateInformation}>
                        <Text style={styles.candidateName}>
                          {candidate.name}
                        </Text>

                        <Text style={styles.partyName}>{candidate.party}</Text>
                      </View>

                      <View style={styles.voteInformation}>
                        <Text style={styles.voteCount}>{candidateVotes}</Text>

                        <Text style={styles.voteLabel}>
                          {candidateVotes === 1 ? "vote" : "votes"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressValue,
                          {
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.percentageText}>
                      {percentage}% of recorded votes
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsTextContainer}>
              <Text style={styles.analyticsTitle}>Election Analytics</Text>

              <Text style={styles.analyticsDescription}>
                Review turnout, voter participation, candidate performance and
                election integrity.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open election analytics"
              onPress={() =>
                router.push({
                  pathname: "/admin-analytics",
                  params: {
                    authenticated: "true",
                  },
                })
              }
              style={({ pressed }) => [
                styles.analyticsButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.analyticsButtonText}>View Analytics</Text>
            </Pressable>
          </View>

          <View style={styles.privacyNotice}>
            <Text style={styles.privacyTitle}>Anonymous result storage</Text>

            <Text style={styles.privacyDescription}>
              Results contain only candidate totals. They do not reveal which
              candidate an individual voter selected.
            </Text>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Election Controls</Text>

            <Text style={styles.dangerDescription}>
              Resetting removes all recorded votes from this device. This action
              cannot be undone.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset election data"
              disabled={isResetting}
              onPress={handleResetElection}
              style={({ pressed }) => [
                styles.resetButton,
                isResetting && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              {isResetting ? (
                <ActivityIndicator color="#B42318" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Election Data</Text>
              )}
            </Pressable>
          </View>
        </View>
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
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.large,
    backgroundColor: COLORS.primaryDark,
  },

  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 6,
    color: "#B7C7D9",
    fontSize: 13,
  },

  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#54708D",
    borderRadius: RADIUS.medium,
  },

  logoutButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    padding: SPACING.large,
    paddingBottom: SPACING.extraLarge,
  },

  summaryCard: {
    padding: SPACING.large,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.primary,
  },

  summaryLabel: {
    color: "#D6E4F2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  summaryValue: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 42,
    fontWeight: "900",
  },

  summaryDescription: {
    marginTop: 4,
    color: "#D6E4F2",
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.extraLarge,
    marginBottom: SPACING.medium,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "800",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.medium,
  },

  refreshButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  resultsList: {
    gap: 12,
  },

  resultCard: {
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  symbolContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.overlay,
  },

  symbolText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  candidateInformation: {
    flex: 1,
    marginHorizontal: 12,
  },

  candidateName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },

  partyName: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  voteInformation: {
    alignItems: "flex-end",
  },

  voteCount: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  voteLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  progressTrack: {
    height: 8,
    marginTop: SPACING.medium,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: COLORS.overlay,
  },

  progressValue: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  percentageText: {
    marginTop: 7,
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "right",
  },

  analyticsCard: {
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  analyticsTextContainer: {
    marginBottom: SPACING.medium,
  },

  analyticsTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  analyticsDescription: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  analyticsButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryDark,
  },

  analyticsButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  privacyNotice: {
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderRadius: RADIUS.medium,
    backgroundColor: "#E2F5EC",
  },

  privacyTitle: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "800",
  },

  privacyDescription: {
    marginTop: 5,
    color: "#34735D",
    fontSize: 13,
    lineHeight: 20,
  },

  dangerZone: {
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: "#F1B7B7",
    borderRadius: RADIUS.medium,
    backgroundColor: "#FFF7F7",
  },

  dangerTitle: {
    color: "#B42318",
    fontSize: 16,
    fontWeight: "800",
  },

  dangerDescription: {
    marginTop: 7,
    color: "#7A3E3A",
    fontSize: 13,
    lineHeight: 20,
  },

  resetButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.medium,
    borderWidth: 1,
    borderColor: "#B42318",
    borderRadius: RADIUS.medium,
  },

  resetButtonText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
