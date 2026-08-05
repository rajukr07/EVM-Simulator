import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../constants/theme";
import type { Candidate } from "../data/candidates";
import { getCandidates } from "../services/candidateStorage";
import {
    getElectionAvailability,
    getElectionConfig,
    getTurnoutStatistics,
    getVoteCounts,
    type ElectionConfig,
    type TurnoutStatistics,
    type VoteCounts,
} from "../services/electionStorage";

type RefreshMode = "initial" | "manual" | "silent";

type RankedCandidate = Candidate & {
  votes: number;
  percentage: number;
  rank: number;
};

const EMPTY_TURNOUT: TurnoutStatistics = {
  participatingVoters: 0,
  totalVotes: 0,
};

function formatLastUpdated(date: Date | null) {
  if (!date) {
    return "Waiting for results";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LiveResultsScreen() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});

  const [electionConfig, setElectionConfig] = useState<ElectionConfig | null>(
    null,
  );

  const [turnout, setTurnout] = useState<TurnoutStatistics>(EMPTY_TURNOUT);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const requestInProgress = useRef(false);
  const screenActive = useRef(false);

  const loadResults = useCallback(async (mode: RefreshMode = "silent") => {
    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;

    if (mode === "initial") {
      setIsLoading(true);
    }

    if (mode === "manual") {
      setIsRefreshing(true);
    }

    try {
      const [storedCandidates, storedVoteCounts, storedConfig, storedTurnout] =
        await Promise.all([
          getCandidates(),
          getVoteCounts(),
          getElectionConfig(),
          getTurnoutStatistics(),
        ]);

      if (!screenActive.current) {
        return;
      }

      setCandidates(storedCandidates);
      setVoteCounts(storedVoteCounts);
      setElectionConfig(storedConfig);
      setTurnout(storedTurnout);
      setLastUpdated(new Date());
    } catch {
      if (screenActive.current && mode !== "silent") {
        Alert.alert(
          "Unable to Load Results",
          "The latest election results could not be loaded.",
        );
      }
    } finally {
      requestInProgress.current = false;

      if (screenActive.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenActive.current = true;

      loadResults("initial");

      const refreshTimer = setInterval(() => {
        loadResults("silent");
      }, 5000);

      return () => {
        screenActive.current = false;
        clearInterval(refreshTimer);
      };
    }, [loadResults]),
  );

  const totalVotes = useMemo(
    () => Object.values(voteCounts).reduce((total, count) => total + count, 0),
    [voteCounts],
  );

  const rankedCandidates = useMemo<RankedCandidate[]>(() => {
    const sortedCandidates = candidates
      .map((candidate) => ({
        ...candidate,
        votes: voteCounts[candidate.id] ?? 0,
      }))
      .sort(
        (firstCandidate, secondCandidate) =>
          secondCandidate.votes - firstCandidate.votes ||
          firstCandidate.name.localeCompare(secondCandidate.name),
      );

    let previousVotes: number | null = null;
    let currentRank = 0;

    return sortedCandidates.map((candidate, index) => {
      if (candidate.votes !== previousVotes) {
        currentRank = index + 1;
      }

      previousVotes = candidate.votes;

      return {
        ...candidate,
        rank: currentRank,
        percentage: totalVotes === 0 ? 0 : (candidate.votes / totalVotes) * 100,
      };
    });
  }, [candidates, totalVotes, voteCounts]);

  const leadingCandidates = useMemo(() => {
    if (totalVotes === 0 || rankedCandidates.length === 0) {
      return [];
    }

    const highestVoteCount = rankedCandidates[0].votes;

    return rankedCandidates.filter(
      (candidate) => candidate.votes === highestVoteCount,
    );
  }, [rankedCandidates, totalVotes]);

  const leaderText = useMemo(() => {
    if (leadingCandidates.length === 0) {
      return "Awaiting first vote";
    }

    if (leadingCandidates.length > 1) {
      return `${leadingCandidates.length}-way tie`;
    }

    return leadingCandidates[0].name;
  }, [leadingCandidates]);

  const availability = electionConfig
    ? getElectionAvailability(electionConfig)
    : null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadResults("manual")}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to previous screen"
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Live Results</Text>

            <View style={styles.liveStatus}>
              <View style={styles.liveIndicator} />

              <Text style={styles.headerSubtitle}>
                Updates automatically every 5 seconds
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh election results"
            disabled={isRefreshing}
            onPress={() => loadResults("manual")}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
            ]}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.refreshButtonText}>Refresh</Text>
            )}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />

            <Text style={styles.loadingText}>Loading election results...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.electionCard}>
              <View style={styles.electionTopRow}>
                <Text style={styles.electionLabel}>PUBLIC ELECTION</Text>

                {availability ? (
                  <View
                    style={[
                      styles.statusBadge,
                      availability.status === "open"
                        ? styles.openStatusBadge
                        : styles.inactiveStatusBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        availability.status === "open"
                          ? styles.openStatusText
                          : styles.inactiveStatusText,
                      ]}
                    >
                      {availability.status.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.electionTitle}>
                {electionConfig?.title ?? "VoteX General Election"}
              </Text>

              <Text style={styles.electionDescription}>
                {electionConfig?.description ?? "Live public election results."}
              </Text>

              <Text style={styles.electionDates}>
                {electionConfig?.startDate || "Start date not configured"}
                {" – "}
                {electionConfig?.endDate || "End date not configured"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Election Summary</Text>

            <View style={styles.statisticsGrid}>
              <View style={styles.statisticCard}>
                <Text style={styles.statisticValue}>{turnout.totalVotes}</Text>

                <Text style={styles.statisticLabel}>Votes Cast</Text>
              </View>

              <View style={styles.statisticCard}>
                <Text style={styles.statisticValue}>
                  {turnout.participatingVoters}
                </Text>

                <Text style={styles.statisticLabel}>Voters</Text>
              </View>

              <View style={styles.statisticCard}>
                <Text style={styles.statisticValue}>{candidates.length}</Text>

                <Text style={styles.statisticLabel}>Candidates</Text>
              </View>
            </View>

            <View style={styles.leaderCard}>
              <View style={styles.leaderInformation}>
                <Text style={styles.leaderLabel}>CURRENT LEADER</Text>

                <Text style={styles.leaderName}>{leaderText}</Text>
              </View>

              {leadingCandidates.length === 1 ? (
                <View style={styles.leaderVoteBadge}>
                  <Text style={styles.leaderVoteText}>
                    {leadingCandidates[0].votes} votes
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.rankingHeader}>
              <Text style={styles.sectionTitle}>Candidate Rankings</Text>

              <Text style={styles.totalVotesText}>
                {totalVotes} total votes
              </Text>
            </View>

            {rankedCandidates.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Candidates Available</Text>

                <Text style={styles.emptyDescription}>
                  The administrator has not configured the election candidates.
                </Text>
              </View>
            ) : (
              <View style={styles.rankingList}>
                {rankedCandidates.map((candidate) => {
                  const progressWidth =
                    candidate.percentage === 0
                      ? "0%"
                      : `${Math.max(candidate.percentage, 2)}%`;

                  return (
                    <View
                      key={candidate.id}
                      style={[
                        styles.candidateCard,
                        candidate.rank === 1 &&
                          totalVotes > 0 &&
                          styles.leadingCandidateCard,
                      ]}
                    >
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

                          <Text style={styles.partyName}>
                            {candidate.party}
                          </Text>
                        </View>

                        <View style={styles.voteInformation}>
                          <Text style={styles.voteNumber}>
                            {candidate.votes}
                          </Text>

                          <Text style={styles.voteLabel}>votes</Text>
                        </View>
                      </View>

                      <View style={styles.progressHeader}>
                        <Text style={styles.percentageText}>
                          {candidate.percentage.toFixed(1)}%
                        </Text>

                        {candidate.rank === 1 && totalVotes > 0 ? (
                          <Text style={styles.leadingText}>LEADING</Text>
                        ) : null}
                      </View>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
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
            )}

            <Text style={styles.updatedText}>
              Last updated: {formatLastUpdated(lastUpdated)}
            </Text>

            <Text style={styles.disclaimer}>
              Results shown here are generated by the VoteX election simulator
              and update automatically.
            </Text>
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
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#54708D",
    borderRadius: RADIUS.medium,
  },

  backButtonText: {
    marginTop: -4,
    color: COLORS.white,
    fontSize: 34,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },

  liveStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  liveIndicator: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 50,
    backgroundColor: "#36D399",
  },

  headerSubtitle: {
    color: "#B7C7D9",
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: "800",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 450,
  },

  loadingText: {
    marginTop: SPACING.medium,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  content: {
    padding: SPACING.large,
    paddingBottom: SPACING.extraLarge,
  },

  electionCard: {
    padding: SPACING.large,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.primary,
  },

  electionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  electionLabel: {
    color: "#D6E4F2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 50,
  },

  openStatusBadge: {
    backgroundColor: "#DDF7EA",
  },

  inactiveStatusBadge: {
    backgroundColor: "#E7EDF4",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  openStatusText: {
    color: "#18794E",
  },

  inactiveStatusText: {
    color: COLORS.primaryDark,
  },

  electionTitle: {
    marginTop: SPACING.medium,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
  },

  electionDescription: {
    marginTop: 8,
    color: "#D6E4F2",
    fontSize: 13,
    lineHeight: 20,
  },

  electionDates: {
    marginTop: SPACING.medium,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "800",
  },

  statisticsGrid: {
    flexDirection: "row",
    gap: 9,
    marginTop: SPACING.medium,
  },

  statisticCard: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  statisticValue: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "900",
  },

  statisticLabel: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  leaderName: {
    marginTop: 5,
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  leaderVoteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: "#C7EBDC",
  },

  leaderVoteText: {
    color: "#18794E",
    fontSize: 11,
    fontWeight: "900",
  },

  rankingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.extraLarge,
    marginBottom: SPACING.medium,
  },

  totalVotesText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  rankingList: {
    gap: 12,
  },

  candidateCard: {
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
  },

  leadingCandidateCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  candidateTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  rankBadge: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    borderRadius: 50,
    backgroundColor: COLORS.overlay,
  },

  rankText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  symbolContainer: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
  },

  symbolText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  candidateInformation: {
    flex: 1,
    marginHorizontal: 11,
  },

  candidateName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },

  partyName: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  voteInformation: {
    alignItems: "flex-end",
  },

  voteNumber: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "900",
  },

  voteLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.medium,
    marginBottom: 7,
  },

  percentageText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  leadingText: {
    color: "#18794E",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 50,
    backgroundColor: COLORS.overlay,
  },

  progressFill: {
    height: "100%",
    borderRadius: 50,
    backgroundColor: COLORS.primary,
  },

  emptyCard: {
    alignItems: "center",
    padding: SPACING.extraLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.surface,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  emptyDescription: {
    marginTop: 7,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  updatedText: {
    marginTop: SPACING.extraLarge,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  disclaimer: {
    marginTop: 7,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
