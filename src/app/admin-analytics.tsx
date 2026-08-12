import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { getVoteCounts, type VoteCounts } from "../services/electionStorage";

type CandidateAnalytics = (typeof CANDIDATES)[number] & {
  votes: number;
  percentage: number;
  rank: number;
};

export default function AdminAnalyticsScreen() {
  const router = useRouter();

  const { authenticated } = useLocalSearchParams<{
    authenticated?: string;
  }>();

  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedVoteCounts = await getVoteCounts();
      setVoteCounts(storedVoteCounts);
    } catch {
      Alert.alert(
        "Unable to Load Analytics",
        "Election analytics could not be loaded. Please try again.",
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

      loadAnalytics();
    }, [authenticated, loadAnalytics, router]),
  );

  const analytics = useMemo(() => {
    const totalVotes = Object.values(voteCounts).reduce(
      (total, count) => total + count,
      0,
    );

    const sortedCandidates = CANDIDATES.map((candidate) => ({
      ...candidate,
      votes: voteCounts[candidate.id] ?? 0,
    })).sort(
      (firstCandidate, secondCandidate) =>
        secondCandidate.votes - firstCandidate.votes ||
        firstCandidate.name.localeCompare(secondCandidate.name),
    );

    let previousVotes: number | null = null;
    let currentRank = 0;

    const candidates: CandidateAnalytics[] = sortedCandidates.map(
      (candidate, index) => {
        if (candidate.votes !== previousVotes) {
          currentRank = index + 1;
        }

        previousVotes = candidate.votes;

        return {
          ...candidate,
          rank: currentRank,
          percentage:
            totalVotes === 0 ? 0 : (candidate.votes / totalVotes) * 100,
        };
      },
    );

    const leadingCandidates = candidates.filter(
      (candidate) => candidate.rank === 1 && candidate.votes > 0,
    );

    const leaderText =
      leadingCandidates.length === 0
        ? "Awaiting first vote"
        : leadingCandidates.length > 1
          ? `${leadingCandidates.length}-way tie`
          : leadingCandidates[0].name;

    const leadingVotes = candidates[0]?.votes ?? 0;
    const secondPlaceVotes = candidates[1]?.votes ?? 0;
    const leadingMargin = Math.max(leadingVotes - secondPlaceVotes, 0);

    const averageVotes =
      candidates.length === 0 ? 0 : totalVotes / candidates.length;

    return {
      totalVotes,
      candidates,
      leaderText,
      leadingMargin,
      averageVotes,
    };
  }, [voteCounts]);

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to election dashboard"
            onPress={() =>
              router.replace({
                pathname: "/admin-dashboard",
                params: {
                  authenticated: "true",
                },
              })
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Election Analytics</Text>

            <Text style={styles.headerSubtitle}>
              Candidate performance and vote distribution
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh election analytics"
            disabled={isLoading}
            onPress={loadAnalytics}
            style={({ pressed }) => [
              styles.refreshButton,
              isLoading && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.refreshButtonText}>Refresh</Text>
            )}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>CURRENT ELECTION</Text>
              <Text style={styles.heroValue}>{analytics.totalVotes}</Text>
              <Text style={styles.heroDescription}>Total votes recorded</Text>
            </View>

            <Text style={styles.sectionTitle}>Performance Overview</Text>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{CANDIDATES.length}</Text>
                <Text style={styles.metricLabel}>Candidates</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analytics.averageVotes.toFixed(1)}
                </Text>
                <Text style={styles.metricLabel}>Average Votes</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analytics.leadingMargin}
                </Text>
                <Text style={styles.metricLabel}>Leading Margin</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {analytics.totalVotes === 0
                    ? "0.0%"
                    : `${(analytics.candidates[0]?.percentage ?? 0).toFixed(1)}%`}
                </Text>
                <Text style={styles.metricLabel}>Top Vote Share</Text>
              </View>
            </View>

            <View style={styles.leaderCard}>
              <View style={styles.leaderInformation}>
                <Text style={styles.leaderLabel}>CURRENT LEADER</Text>
                <Text style={styles.leaderName}>{analytics.leaderText}</Text>
              </View>

              <Text style={styles.leaderIcon}>★</Text>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionHeaderTitle}>
                  Candidate Performance
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Ranked by recorded votes
                </Text>
              </View>

              <Text style={styles.totalText}>{analytics.totalVotes} votes</Text>
            </View>

            <View style={styles.candidateList}>
              {analytics.candidates.map((candidate) => {
                const progressWidth =
                  candidate.percentage === 0
                    ? "0%"
                    : `${Math.max(candidate.percentage, 2)}%`;

                return (
                  <View key={candidate.id} style={styles.candidateCard}>
                    <View style={styles.candidateTopRow}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{candidate.rank}</Text>
                      </View>

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
                        <Text style={styles.voteValue}>{candidate.votes}</Text>
                        <Text style={styles.voteLabel}>
                          {candidate.votes === 1 ? "vote" : "votes"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.percentageRow}>
                      <Text style={styles.percentageText}>
                        {candidate.percentage.toFixed(1)}%
                      </Text>

                      {candidate.rank === 1 && candidate.votes > 0 ? (
                        <Text style={styles.leadingText}>LEADING</Text>
                      ) : null}
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressValue,
                          {
                            width: progressWidth as `${number}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.privacyCard}>
              <Text style={styles.privacyTitle}>Privacy protected</Text>

              <Text style={styles.privacyDescription}>
                Analytics use only anonymous candidate totals. No voter identity
                or individual selection is displayed.
              </Text>
            </View>
          </View>
        )}
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
    padding: SPACING.large,
    backgroundColor: COLORS.primaryDark,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#54708D",
    borderRadius: RADIUS.medium,
  },

  backButtonText: {
    marginTop: -4,
    color: COLORS.white,
    fontSize: 34,
  },

  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 5,
    color: "#B7C7D9",
    fontSize: 11,
  },

  refreshButton: {
    minWidth: 68,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#54708D",
    borderRadius: RADIUS.medium,
  },

  refreshButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  loadingContainer: {
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  content: {
    padding: SPACING.large,
    paddingBottom: SPACING.extraLarge,
  },

  heroCard: {
    padding: SPACING.large,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.primary,
  },

  heroLabel: {
    color: "#D6E4F2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroValue: {
    marginTop: 10,
    color: COLORS.white,
    fontSize: 42,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 3,
    color: "#D6E4F2",
    fontSize: 13,
  },

  sectionTitle: {
    marginTop: SPACING.extraLarge,
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "800",
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: SPACING.medium,
  },

  metricCard: {
    width: "48%",
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  metricValue: {
    color: COLORS.primary,
    fontSize: 23,
    fontWeight: "900",
  },

  metricLabel: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  leaderCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.medium,
    padding: SPACING.medium,
    borderRadius: RADIUS.medium,
    backgroundColor: "#E2F5EC",
  },

  leaderInformation: {
    flex: 1,
  },

  leaderLabel: {
    color: "#18794E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  leaderName: {
    marginTop: 5,
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  leaderIcon: {
    color: "#18794E",
    fontSize: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.extraLarge,
    marginBottom: SPACING.medium,
  },

  sectionHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  totalText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  candidateList: {
    gap: 11,
  },

  candidateCard: {
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  candidateTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  rankBadge: {
    minWidth: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderRadius: 50,
    backgroundColor: COLORS.overlay,
  },

  rankText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  symbolContainer: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
  },

  symbolText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  candidateInformation: {
    flex: 1,
    marginHorizontal: 10,
  },

  candidateName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  partyName: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  voteInformation: {
    alignItems: "flex-end",
  },

  voteValue: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "900",
  },

  voteLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  percentageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.medium,
    marginBottom: 7,
  },

  percentageText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  leadingText: {
    color: "#18794E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: COLORS.overlay,
  },

  progressValue: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  privacyCard: {
    marginTop: SPACING.large,
    padding: SPACING.medium,
    borderRadius: RADIUS.medium,
    backgroundColor: "#E2F5EC",
  },

  privacyTitle: {
    color: "#18794E",
    fontSize: 14,
    fontWeight: "800",
  },

  privacyDescription: {
    marginTop: 5,
    color: "#34735D",
    fontSize: 12,
    lineHeight: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
