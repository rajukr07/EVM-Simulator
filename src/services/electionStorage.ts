import AsyncStorage from "@react-native-async-storage/async-storage";

const VOTED_VOTERS_KEY = "@votex/voted-voters";
const VOTE_COUNTS_KEY = "@votex/vote-counts";
const ELECTION_CONFIG_KEY = "@votex/election-config";

export type VoteCounts = Record<string, number>;
export type ElectionStatus = "open" | "closed";

export type ElectionConfig = {
  status: ElectionStatus;
  updatedAt: string;
};

export type RecordVoteResult =
  | {
      success: true;
      receiptId: string;
      recordedAt: string;
    }
  | {
      success: false;
      reason: "ALREADY_VOTED" | "ELECTION_CLOSED";
    };

const DEFAULT_ELECTION_CONFIG: ElectionConfig = {
  status: "open",
  updatedAt: new Date().toISOString(),
};

function parseStoredValue<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createReceiptId() {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomValue = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `VTX-${timestamp}-${randomValue}`;
}

export async function getElectionConfig(): Promise<ElectionConfig> {
  const storedValue = await AsyncStorage.getItem(ELECTION_CONFIG_KEY);

  return parseStoredValue<ElectionConfig>(
    storedValue,
    DEFAULT_ELECTION_CONFIG
  );
}

export async function setElectionStatus(
  status: ElectionStatus
): Promise<ElectionConfig> {
  const updatedConfig: ElectionConfig = {
    status,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    ELECTION_CONFIG_KEY,
    JSON.stringify(updatedConfig)
  );

  return updatedConfig;
}

export async function hasVoterVoted(voterId: string) {
  const storedValue = await AsyncStorage.getItem(VOTED_VOTERS_KEY);

  const votedVoters = parseStoredValue<string[]>(storedValue, []);

  return votedVoters.includes(voterId.trim().toUpperCase());
}

export async function recordVote(
  voterId: string,
  candidateId: string
): Promise<RecordVoteResult> {
  const electionConfig = await getElectionConfig();

  if (electionConfig.status !== "open") {
    return {
      success: false,
      reason: "ELECTION_CLOSED",
    };
  }

  const normalizedVoterId = voterId.trim().toUpperCase();

  const [[, storedVoters], [, storedCounts]] =
    await AsyncStorage.multiGet([
      VOTED_VOTERS_KEY,
      VOTE_COUNTS_KEY,
    ]);

  const votedVoters = parseStoredValue<string[]>(storedVoters, []);
  const voteCounts = parseStoredValue<VoteCounts>(storedCounts, {});

  if (votedVoters.includes(normalizedVoterId)) {
    return {
      success: false,
      reason: "ALREADY_VOTED",
    };
  }

  const updatedVoters = [...votedVoters, normalizedVoterId];

  const updatedVoteCounts = {
    ...voteCounts,
    [candidateId]: (voteCounts[candidateId] ?? 0) + 1,
  };

  await AsyncStorage.multiSet([
    [VOTED_VOTERS_KEY, JSON.stringify(updatedVoters)],
    [VOTE_COUNTS_KEY, JSON.stringify(updatedVoteCounts)],
  ]);

  return {
    success: true,
    receiptId: createReceiptId(),
    recordedAt: new Date().toISOString(),
  };
}

export async function getVoteCounts(): Promise<VoteCounts> {
  const storedValue = await AsyncStorage.getItem(VOTE_COUNTS_KEY);

  return parseStoredValue<VoteCounts>(storedValue, {});
}

export async function resetElectionData() {
  await AsyncStorage.multiRemove([
    VOTED_VOTERS_KEY,
    VOTE_COUNTS_KEY,
  ]);
}