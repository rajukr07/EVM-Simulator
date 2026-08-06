import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const VOTED_VOTERS_KEY = "@votex/voted-voters";
const VOTE_COUNTS_KEY = "@votex/vote-counts";
const ELECTION_CONFIG_KEY = "@votex/election-config";
const VOTE_RECEIPTS_KEY = "@votex/vote-receipts";
const AUDIT_LOG_KEY = "@votex/audit-log";

const GENESIS_HASH = "VOTEX-GENESIS";

export type VoteCounts = Record<string, number>;
export type ElectionStatus = "open" | "closed";

export type ElectionConfig = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
  updatedAt: string;
};

export type ElectionAvailabilityStatus =
  | "open"
  | "closed"
  | "upcoming"
  | "ended";

export type ElectionAvailability = {
  status: ElectionAvailabilityStatus;
  canVote: boolean;
  message: string;
};

export type ElectionDetailsInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

export type TurnoutStatistics = {
  participatingVoters: number;
  totalVotes: number;
};

export type RecordVoteResult =
  | {
      success: true;
      receiptId: string;
      recordedAt: string;
    }
  | {
      success: false;
      reason:
        | "ALREADY_VOTED"
        | "ELECTION_CLOSED"
        | "ELECTION_NOT_STARTED"
        | "ELECTION_ENDED";
    };

export type ReceiptVerificationResult =
  | {
      verified: true;
      receiptId: string;
      recordedAt: string;
      integrityCode: string;
    }
  | {
      verified: false;
      reason: "NOT_FOUND" | "INTEGRITY_CHECK_FAILED";
    };

type StoredVoteReceipt = {
  receiptId: string;
  recordedAt: string;
  integrityHash: string;
};

export type AuditLogEntry = {
  id: string;
  sequence: number;
  eventType: "VOTE_RECORDED";
  receiptReference: string;
  receiptHash: string;
  recordedAt: string;
  previousHash: string;
  eventHash: string;
};

export type AuditReport = {
  entries: AuditLogEntry[];
  isValid: boolean;
  verifiedAt: string;
};

const DEFAULT_ELECTION_CONFIG: ElectionConfig = {
  title: "VoteX General Election",
  description: "A secure digital election powered by the VoteX simulator.",
  startDate: "",
  endDate: "",
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

function parseStoredArray<T>(value: string | null): T[] {
  const parsedValue = parseStoredValue<unknown>(value, []);

  return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
}

function createReceiptId() {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomValue = Crypto.randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase();

  return `VTX-${timestamp}-${randomValue}`;
}

async function createHash(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function createReceiptHashInput(receiptId: string, recordedAt: string) {
  return JSON.stringify(["VOTEX_RECEIPT_V1", receiptId, recordedAt]);
}

async function createReceiptIntegrityHash(
  receiptId: string,
  recordedAt: string,
) {
  return createHash(createReceiptHashInput(receiptId, recordedAt));
}

async function createAuditEventHash(entry: Omit<AuditLogEntry, "eventHash">) {
  return createHash(
    JSON.stringify([
      entry.id,
      entry.sequence,
      entry.eventType,
      entry.receiptReference,
      entry.receiptHash,
      entry.recordedAt,
      entry.previousHash,
    ]),
  );
}

function createReceiptReference(receiptId: string) {
  return `••••-${receiptId.slice(-8)}`;
}

function parseElectionDate(value: string, useEndOfDay = false): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    useEndOfDay ? 23 : 0,
    useEndOfDay ? 59 : 0,
    useEndOfDay ? 59 : 0,
    useEndOfDay ? 999 : 0,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidElectionDate(value: string) {
  return parseElectionDate(value) !== null;
}

export async function getElectionConfig(): Promise<ElectionConfig> {
  const storedValue = await AsyncStorage.getItem(ELECTION_CONFIG_KEY);

  const storedConfig = parseStoredValue<Partial<ElectionConfig>>(
    storedValue,
    {},
  );

  return {
    ...DEFAULT_ELECTION_CONFIG,
    ...storedConfig,
    status: storedConfig.status === "closed" ? "closed" : "open",
  };
}

async function saveElectionConfig(config: ElectionConfig) {
  await AsyncStorage.setItem(ELECTION_CONFIG_KEY, JSON.stringify(config));
}

export function getElectionAvailability(
  config: ElectionConfig,
  currentDate = new Date(),
): ElectionAvailability {
  if (config.status === "closed") {
    return {
      status: "closed",
      canVote: false,
      message: "Voting is currently closed by the election administrator.",
    };
  }

  const startDate = config.startDate
    ? parseElectionDate(config.startDate)
    : null;

  const endDate = config.endDate
    ? parseElectionDate(config.endDate, true)
    : null;

  if (startDate && currentDate < startDate) {
    return {
      status: "upcoming",
      canVote: false,
      message: `Voting will begin on ${config.startDate}.`,
    };
  }

  if (endDate && currentDate > endDate) {
    return {
      status: "ended",
      canVote: false,
      message: `Voting ended on ${config.endDate}.`,
    };
  }

  return {
    status: "open",
    canVote: true,
    message: "Voting is currently open.",
  };
}

export async function updateElectionDetails(
  input: ElectionDetailsInput,
): Promise<ElectionConfig> {
  const title = input.title.trim();
  const description = input.description.trim();
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();

  if (!title || !description || !startDate || !endDate) {
    throw new Error("Please complete all election information.");
  }

  if (!isValidElectionDate(startDate) || !isValidElectionDate(endDate)) {
    throw new Error("Enter valid dates using the YYYY-MM-DD format.");
  }

  if (endDate < startDate) {
    throw new Error("The election end date cannot be before the start date.");
  }

  const currentConfig = await getElectionConfig();

  if (currentConfig.status !== "closed") {
    throw new Error("Close voting before changing election settings.");
  }

  const updatedConfig: ElectionConfig = {
    ...currentConfig,
    title,
    description,
    startDate,
    endDate,
    updatedAt: new Date().toISOString(),
  };

  await saveElectionConfig(updatedConfig);

  return updatedConfig;
}

export async function setElectionStatus(
  status: ElectionStatus,
): Promise<ElectionConfig> {
  const currentConfig = await getElectionConfig();

  const updatedConfig: ElectionConfig = {
    ...currentConfig,
    status,
    updatedAt: new Date().toISOString(),
  };

  await saveElectionConfig(updatedConfig);

  return updatedConfig;
}

export async function hasVoterVoted(voterId: string) {
  const storedValue = await AsyncStorage.getItem(VOTED_VOTERS_KEY);

  const votedVoters = parseStoredArray<string>(storedValue);

  return votedVoters.includes(voterId.trim().toUpperCase());
}

export async function recordVote(
  voterId: string,
  candidateId: string,
): Promise<RecordVoteResult> {
  const electionConfig = await getElectionConfig();

  const availability = getElectionAvailability(electionConfig);

  if (!availability.canVote) {
    const reason =
      availability.status === "upcoming"
        ? "ELECTION_NOT_STARTED"
        : availability.status === "ended"
          ? "ELECTION_ENDED"
          : "ELECTION_CLOSED";

    return {
      success: false,
      reason,
    };
  }

  const normalizedVoterId = voterId.trim().toUpperCase();

  const [
    [, storedVoters],
    [, storedCounts],
    [, storedReceipts],
    [, storedAuditLog],
  ] = await AsyncStorage.multiGet([
    VOTED_VOTERS_KEY,
    VOTE_COUNTS_KEY,
    VOTE_RECEIPTS_KEY,
    AUDIT_LOG_KEY,
  ]);

  const votedVoters = parseStoredArray<string>(storedVoters);

  const voteCounts = parseStoredValue<VoteCounts>(storedCounts, {});

  const receipts = parseStoredArray<StoredVoteReceipt>(storedReceipts);

  const auditLog = parseStoredArray<AuditLogEntry>(storedAuditLog);

  if (votedVoters.includes(normalizedVoterId)) {
    return {
      success: false,
      reason: "ALREADY_VOTED",
    };
  }

  const receiptId = createReceiptId();
  const recordedAt = new Date().toISOString();

  const integrityHash = await createReceiptIntegrityHash(receiptId, recordedAt);

  const receipt: StoredVoteReceipt = {
    receiptId,
    recordedAt,
    integrityHash,
  };

  const previousHash =
    auditLog.length > 0
      ? auditLog[auditLog.length - 1].eventHash
      : GENESIS_HASH;

  const auditEntryWithoutHash: Omit<AuditLogEntry, "eventHash"> = {
    id: Crypto.randomUUID(),
    sequence: auditLog.length + 1,
    eventType: "VOTE_RECORDED",
    receiptReference: createReceiptReference(receiptId),
    receiptHash: integrityHash,
    recordedAt,
    previousHash,
  };

  const eventHash = await createAuditEventHash(auditEntryWithoutHash);

  const auditEntry: AuditLogEntry = {
    ...auditEntryWithoutHash,
    eventHash,
  };

  const updatedVoters = [...votedVoters, normalizedVoterId];

  const updatedVoteCounts: VoteCounts = {
    ...voteCounts,
    [candidateId]: (voteCounts[candidateId] ?? 0) + 1,
  };

  await AsyncStorage.multiSet([
    [VOTED_VOTERS_KEY, JSON.stringify(updatedVoters)],
    [VOTE_COUNTS_KEY, JSON.stringify(updatedVoteCounts)],
    [VOTE_RECEIPTS_KEY, JSON.stringify([...receipts, receipt])],
    [AUDIT_LOG_KEY, JSON.stringify([...auditLog, auditEntry])],
  ]);

  return {
    success: true,
    receiptId,
    recordedAt,
  };
}

export async function verifyVoteReceipt(
  receiptId: string,
): Promise<ReceiptVerificationResult> {
  const normalizedReceiptId = receiptId.trim().toUpperCase();

  const storedValue = await AsyncStorage.getItem(VOTE_RECEIPTS_KEY);

  const receipts = parseStoredArray<StoredVoteReceipt>(storedValue);

  const receipt = receipts.find(
    (storedReceipt) => storedReceipt.receiptId === normalizedReceiptId,
  );

  if (!receipt) {
    return {
      verified: false,
      reason: "NOT_FOUND",
    };
  }

  const expectedHash = await createReceiptIntegrityHash(
    receipt.receiptId,
    receipt.recordedAt,
  );

  if (expectedHash !== receipt.integrityHash) {
    return {
      verified: false,
      reason: "INTEGRITY_CHECK_FAILED",
    };
  }

  return {
    verified: true,
    receiptId: receipt.receiptId,
    recordedAt: receipt.recordedAt,
    integrityCode: receipt.integrityHash.slice(0, 16).toUpperCase(),
  };
}

export async function getAuditReport(): Promise<AuditReport> {
  const storedValue = await AsyncStorage.getItem(AUDIT_LOG_KEY);

  const entries = parseStoredArray<AuditLogEntry>(storedValue);

  let isValid = true;
  let expectedPreviousHash = GENESIS_HASH;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    const { eventHash, ...entryWithoutHash } = entry;

    const expectedEventHash = await createAuditEventHash(entryWithoutHash);

    const sequenceIsValid = entry.sequence === index + 1;

    const previousHashIsValid = entry.previousHash === expectedPreviousHash;

    const eventHashIsValid = eventHash === expectedEventHash;

    if (!sequenceIsValid || !previousHashIsValid || !eventHashIsValid) {
      isValid = false;
      break;
    }

    expectedPreviousHash = entry.eventHash;
  }

  return {
    entries,
    isValid,
    verifiedAt: new Date().toISOString(),
  };
}

export async function getVoteCounts(): Promise<VoteCounts> {
  const storedValue = await AsyncStorage.getItem(VOTE_COUNTS_KEY);

  return parseStoredValue<VoteCounts>(storedValue, {});
}

export async function getTurnoutStatistics(): Promise<TurnoutStatistics> {
  const [[, storedVoters], [, storedCounts]] = await AsyncStorage.multiGet([
    VOTED_VOTERS_KEY,
    VOTE_COUNTS_KEY,
  ]);

  const votedVoters = parseStoredArray<string>(storedVoters);

  const voteCounts = parseStoredValue<VoteCounts>(storedCounts, {});

  const totalVotes = Object.values(voteCounts).reduce(
    (total, count) => total + Math.max(0, count),
    0,
  );

  return {
    participatingVoters: new Set(votedVoters).size,
    totalVotes,
  };
}

export async function resetElectionData() {
  await AsyncStorage.multiRemove([
    VOTED_VOTERS_KEY,
    VOTE_COUNTS_KEY,
    VOTE_RECEIPTS_KEY,
    AUDIT_LOG_KEY,
  ]);
}
