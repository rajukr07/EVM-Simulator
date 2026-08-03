import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_CANDIDATES, type Candidate } from "../data/candidates";

const CANDIDATES_KEY = "@votex/candidates";

export type CandidateInput = {
  name: string;
  party: string;
  symbol: string;
};

function createCandidateId() {
  const timestamp = Date.now().toString(36);

  const randomValue = Math.random().toString(36).substring(2, 7);

  return `candidate-${timestamp}-${randomValue}`;
}

function normalizeInput(input: CandidateInput): CandidateInput {
  return {
    name: input.name.trim(),
    party: input.party.trim(),
    symbol: input.symbol.trim().toUpperCase(),
  };
}

function getDefaultCandidates() {
  return DEFAULT_CANDIDATES.map((candidate) => ({
    ...candidate,
  }));
}

export async function getCandidates(): Promise<Candidate[]> {
  const storedValue = await AsyncStorage.getItem(CANDIDATES_KEY);

  if (!storedValue) {
    return getDefaultCandidates();
  }

  try {
    const candidates = JSON.parse(storedValue) as Candidate[];

    if (!Array.isArray(candidates)) {
      return getDefaultCandidates();
    }

    return candidates;
  } catch {
    return getDefaultCandidates();
  }
}

async function saveCandidates(candidates: Candidate[]) {
  await AsyncStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
}

export async function addCandidate(input: CandidateInput): Promise<Candidate> {
  const candidates = await getCandidates();
  const normalizedInput = normalizeInput(input);

  const candidate: Candidate = {
    id: createCandidateId(),
    ...normalizedInput,
  };

  await saveCandidates([...candidates, candidate]);

  return candidate;
}

export async function updateCandidate(
  candidateId: string,
  input: CandidateInput,
): Promise<Candidate> {
  const candidates = await getCandidates();
  const normalizedInput = normalizeInput(input);

  const existingCandidate = candidates.find(
    (candidate) => candidate.id === candidateId,
  );

  if (!existingCandidate) {
    throw new Error("Candidate not found.");
  }

  const updatedCandidate: Candidate = {
    ...existingCandidate,
    ...normalizedInput,
  };

  const updatedCandidates = candidates.map((candidate) =>
    candidate.id === candidateId ? updatedCandidate : candidate,
  );

  await saveCandidates(updatedCandidates);

  return updatedCandidate;
}

export async function removeCandidate(candidateId: string) {
  const candidates = await getCandidates();

  const updatedCandidates = candidates.filter(
    (candidate) => candidate.id !== candidateId,
  );

  await saveCandidates(updatedCandidates);
}

export async function restoreDefaultCandidates() {
  const candidates = getDefaultCandidates();

  await saveCandidates(candidates);

  return candidates;
}
