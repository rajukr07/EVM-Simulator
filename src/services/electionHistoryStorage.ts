import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import type { Candidate } from "../data/candidates";
import { getCandidates } from "./candidateStorage";
import {
    getAuditReport,
    getElectionConfig,
    getTurnoutStatistics,
    getVoteCounts,
    prepareNextElectionCycle,
} from "./electionStorage";

const ELECTION_HISTORY_KEY = "@votex/election-history";

export type HistoricalCandidateResult = Candidate & {
  votes: number;
  percentage: number;
  rank: number;
};

export type ElectionHistoryRecord = {
  id: string;
  sourceFingerprint: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  finalizedAt: string;
  totalVotes: number;
  participatingVoters: number;
  winnerNames: string[];
  auditEntryCount: number;
  auditIntegrityValid: boolean;
  candidateResults: HistoricalCandidateResult[];
};

function parseStoredHistory(value: string | null): ElectionHistoryRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? (parsedValue as ElectionHistoryRecord[])
      : [];
  } catch {
    return [];
  }
}

async function saveElectionHistory(records: ElectionHistoryRecord[]) {
  await AsyncStorage.setItem(ELECTION_HISTORY_KEY, JSON.stringify(records));
}

async function createFingerprint(value: unknown) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    JSON.stringify(value),
  );
}

export async function getElectionHistory(): Promise<ElectionHistoryRecord[]> {
  const storedValue = await AsyncStorage.getItem(ELECTION_HISTORY_KEY);

  return parseStoredHistory(storedValue).sort(
    (firstRecord, secondRecord) =>
      new Date(secondRecord.finalizedAt).getTime() -
      new Date(firstRecord.finalizedAt).getTime(),
  );
}

export async function finalizeCurrentElection(): Promise<ElectionHistoryRecord> {
  const [
    electionConfig,
    candidates,
    voteCounts,
    turnout,
    auditReport,
    currentHistory,
  ] = await Promise.all([
    getElectionConfig(),
    getCandidates(),
    getVoteCounts(),
    getTurnoutStatistics(),
    getAuditReport(),
    getElectionHistory(),
  ]);

  if (electionConfig.status !== "closed") {
    throw new Error("Close voting before finalizing the election.");
  }

  if (candidates.length < 2) {
    throw new Error(
      "At least two candidates are required before finalization.",
    );
  }

  if (turnout.totalVotes === 0) {
    throw new Error("An election with no recorded votes cannot be finalized.");
  }

  if (turnout.totalVotes !== turnout.participatingVoters) {
    throw new Error(
      "Vote and voter totals do not match. Review the election data before finalization.",
    );
  }

  if (!auditReport.isValid) {
    throw new Error(
      "The audit log integrity check failed. Finalization has been blocked.",
    );
  }

  if (auditReport.entries.length !== turnout.totalVotes) {
    throw new Error(
      "The number of audit events does not match the recorded vote total.",
    );
  }

  const sortedCandidateResults = candidates
    .map((candidate) => ({
      ...candidate,
      votes: voteCounts[candidate.id] ?? 0,
    }))
    .sort(
      (firstCandidate, secondCandidate) =>
        secondCandidate.votes - firstCandidate.votes ||
        firstCandidate.name.localeCompare(secondCandidate.name),
    );

  let previousVoteCount: number | null = null;
  let currentRank = 0;

  const candidateResults: HistoricalCandidateResult[] =
    sortedCandidateResults.map((candidate, index) => {
      if (candidate.votes !== previousVoteCount) {
        currentRank = index + 1;
      }

      previousVoteCount = candidate.votes;

      return {
        ...candidate,
        rank: currentRank,
        percentage:
          turnout.totalVotes === 0
            ? 0
            : (candidate.votes / turnout.totalVotes) * 100,
      };
    });

  const candidateVoteTotal = candidateResults.reduce(
    (total, candidate) => total + candidate.votes,
    0,
  );

  if (candidateVoteTotal !== turnout.totalVotes) {
    throw new Error(
      "Candidate vote totals do not match the election vote total.",
    );
  }

  const winnerNames = candidateResults
    .filter((candidate) => candidate.rank === 1 && candidate.votes > 0)
    .map((candidate) => candidate.name);

  const sourceFingerprint = await createFingerprint({
    electionUpdatedAt: electionConfig.updatedAt,
    totalVotes: turnout.totalVotes,
    candidateResults: candidateResults.map((candidate) => ({
      id: candidate.id,
      votes: candidate.votes,
    })),
    lastAuditHash: auditReport.entries.at(-1)?.eventHash ?? "",
  });

  const duplicateRecord = currentHistory.find(
    (record) => record.sourceFingerprint === sourceFingerprint,
  );

  if (duplicateRecord) {
    throw new Error("This election has already been finalized.");
  }

  const historyRecord: ElectionHistoryRecord = {
    id: Crypto.randomUUID(),
    sourceFingerprint,
    title: electionConfig.title,
    description: electionConfig.description,
    startDate: electionConfig.startDate,
    endDate: electionConfig.endDate,
    finalizedAt: new Date().toISOString(),
    totalVotes: turnout.totalVotes,
    participatingVoters: turnout.participatingVoters,
    winnerNames,
    auditEntryCount: auditReport.entries.length,
    auditIntegrityValid: auditReport.isValid,
    candidateResults,
  };

  const updatedHistory = [historyRecord, ...currentHistory];

  await saveElectionHistory(updatedHistory);

  try {
    await prepareNextElectionCycle();
  } catch {
    await saveElectionHistory(currentHistory);

    throw new Error("The election could not be prepared for the next cycle.");
  }

  return historyRecord;
}
