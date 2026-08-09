import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { DEFAULT_VOTERS } from "../data/voters";
import {
  getElectionConfig,
  hasVoterVoted,
} from "./electionStorage";

const VOTERS_KEY = "@votex/voters";

type StoredVoter = {
  id: string;
  name: string;
  pinHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Voter = Omit<StoredVoter, "pinHash">;

export type VoterInput = {
  id: string;
  name: string;
  pin: string;
};

export type VoterVerificationResult =
  | {
      success: true;
      voter: Voter;
    }
  | {
      success: false;
      reason:
        | "NOT_FOUND"
        | "INVALID_PIN"
        | "INACTIVE";
    };

function normalizeVoterId(value: string) {
  return value.trim().toUpperCase();
}

function normalizePin(value: string) {
  return value.replace(/\D/g, "");
}

function toPublicVoter(voter: StoredVoter): Voter {
  const { pinHash, ...publicVoter } = voter;

  return publicVoter;
}

function parseStoredVoters(
  value: string | null
): StoredVoter[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? (parsedValue as StoredVoter[])
      : [];
  } catch {
    return [];
  }
}

async function createPinHash(
  voterId: string,
  pin: string
) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    JSON.stringify([
      "VOTEX_VOTER_PIN_V1",
      normalizeVoterId(voterId),
      normalizePin(pin),
    ])
  );
}

async function createDefaultVoters(): Promise<
  StoredVoter[]
> {
  const createdAt = new Date().toISOString();

  return Promise.all(
    DEFAULT_VOTERS.map(async (voter) => ({
      id: normalizeVoterId(voter.id),
      name: voter.name.trim(),
      pinHash: await createPinHash(
        voter.id,
        voter.pin
      ),
      isActive: voter.isActive,
      createdAt,
      updatedAt: createdAt,
    }))
  );
}

async function getStoredVoters(): Promise<
  StoredVoter[]
> {
  const storedValue = await AsyncStorage.getItem(
    VOTERS_KEY
  );

  if (storedValue) {
    return parseStoredVoters(storedValue);
  }

  const defaultVoters =
    await createDefaultVoters();

  await saveStoredVoters(defaultVoters);

  return defaultVoters;
}

async function saveStoredVoters(
  voters: StoredVoter[]
) {
  await AsyncStorage.setItem(
    VOTERS_KEY,
    JSON.stringify(voters)
  );
}

async function assertVoterManagementAllowed() {
  const electionConfig =
    await getElectionConfig();

  if (electionConfig.status !== "closed") {
    throw new Error(
      "Close voting before changing the voter registry."
    );
  }
}

function validateVoterId(voterId: string) {
  if (!/^[A-Z0-9-]{4,20}$/.test(voterId)) {
    throw new Error(
      "Voter ID must contain 4 to 20 uppercase letters, numbers or hyphens."
    );
  }
}

function validateVoterName(name: string) {
  if (name.length < 2 || name.length > 60) {
    throw new Error(
      "Voter name must contain between 2 and 60 characters."
    );
  }
}

function validatePin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error(
      "The voter PIN must contain exactly four digits."
    );
  }
}

export async function getVoters(): Promise<
  Voter[]
> {
  const voters = await getStoredVoters();

  return voters
    .map(toPublicVoter)
    .sort((firstVoter, secondVoter) =>
      firstVoter.id.localeCompare(
        secondVoter.id
      )
    );
}

export async function verifyVoterCredentials(
  voterId: string,
  pin: string
): Promise<VoterVerificationResult> {
  const normalizedVoterId =
    normalizeVoterId(voterId);

  const normalizedPin = normalizePin(pin);
  const voters = await getStoredVoters();

  const voter = voters.find(
    (storedVoter) =>
      storedVoter.id === normalizedVoterId
  );

  if (!voter) {
    return {
      success: false,
      reason: "NOT_FOUND",
    };
  }

  const enteredPinHash = await createPinHash(
    normalizedVoterId,
    normalizedPin
  );

  if (enteredPinHash !== voter.pinHash) {
    return {
      success: false,
      reason: "INVALID_PIN",
    };
  }

  if (!voter.isActive) {
    return {
      success: false,
      reason: "INACTIVE",
    };
  }

  return {
    success: true,
    voter: toPublicVoter(voter),
  };
}

export async function addVoter(
  input: VoterInput
): Promise<Voter> {
  await assertVoterManagementAllowed();

  const id = normalizeVoterId(input.id);
  const name = input.name.trim();
  const pin = normalizePin(input.pin);

  validateVoterId(id);
  validateVoterName(name);
  validatePin(pin);

  const voters = await getStoredVoters();

  const duplicateVoter = voters.some(
    (voter) => voter.id === id
  );

  if (duplicateVoter) {
    throw new Error(
      "A voter with this ID already exists."
    );
  }

  const timestamp = new Date().toISOString();

  const voter: StoredVoter = {
    id,
    name,
    pinHash: await createPinHash(id, pin),
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await saveStoredVoters([...voters, voter]);

  return toPublicVoter(voter);
}

export async function updateVoter(
  currentVoterId: string,
  input: VoterInput
): Promise<Voter> {
  await assertVoterManagementAllowed();

  const normalizedCurrentId =
    normalizeVoterId(currentVoterId);

  const updatedId = normalizeVoterId(input.id);
  const updatedName = input.name.trim();
  const updatedPin = normalizePin(input.pin);

  validateVoterId(updatedId);
  validateVoterName(updatedName);

  if (updatedPin) {
    validatePin(updatedPin);
  }

  const voters = await getStoredVoters();

  const existingVoter = voters.find(
    (voter) =>
      voter.id === normalizedCurrentId
  );

  if (!existingVoter) {
    throw new Error("Voter not found.");
  }

  const duplicateVoter = voters.some(
    (voter) =>
      voter.id !== normalizedCurrentId &&
      voter.id === updatedId
  );

  if (duplicateVoter) {
    throw new Error(
      "A voter with this ID already exists."
    );
  }

  const voterIdChanged =
    updatedId !== normalizedCurrentId;

  if (voterIdChanged) {
    const alreadyVoted = await hasVoterVoted(
      normalizedCurrentId
    );

    if (alreadyVoted) {
      throw new Error(
        "The ID of a voter who has already voted cannot be changed."
      );
    }

    if (!updatedPin) {
      throw new Error(
        "Enter a new PIN when changing the voter ID."
      );
    }
  }

  const updatedVoter: StoredVoter = {
    ...existingVoter,
    id: updatedId,
    name: updatedName,
    pinHash: updatedPin
      ? await createPinHash(
          updatedId,
          updatedPin
        )
      : existingVoter.pinHash,
    updatedAt: new Date().toISOString(),
  };

  const updatedVoters = voters.map((voter) =>
    voter.id === normalizedCurrentId
      ? updatedVoter
      : voter
  );

  await saveStoredVoters(updatedVoters);

  return toPublicVoter(updatedVoter);
}

export async function setVoterActiveStatus(
  voterId: string,
  isActive: boolean
): Promise<Voter> {
  await assertVoterManagementAllowed();

  const normalizedVoterId =
    normalizeVoterId(voterId);

  const voters = await getStoredVoters();

  const existingVoter = voters.find(
    (voter) => voter.id === normalizedVoterId
  );

  if (!existingVoter) {
    throw new Error("Voter not found.");
  }

  const activeVoterCount = voters.filter(
    (voter) => voter.isActive
  ).length;

  if (
    !isActive &&
    existingVoter.isActive &&
    activeVoterCount <= 1
  ) {
    throw new Error(
      "At least one active voter must remain in the registry."
    );
  }

  const updatedVoter: StoredVoter = {
    ...existingVoter,
    isActive,
    updatedAt: new Date().toISOString(),
  };

  const updatedVoters = voters.map((voter) =>
    voter.id === normalizedVoterId
      ? updatedVoter
      : voter
  );

  await saveStoredVoters(updatedVoters);

  return toPublicVoter(updatedVoter);
}

export async function removeVoter(
  voterId: string
) {
  await assertVoterManagementAllowed();

  const normalizedVoterId =
    normalizeVoterId(voterId);

  const voters = await getStoredVoters();

  const existingVoter = voters.find(
    (voter) => voter.id === normalizedVoterId
  );

  if (!existingVoter) {
    throw new Error("Voter not found.");
  }

  if (voters.length <= 1) {
    throw new Error(
      "At least one voter must remain in the registry."
    );
  }

  const alreadyVoted = await hasVoterVoted(
    normalizedVoterId
  );

  if (alreadyVoted) {
    throw new Error(
      "A voter with a recorded vote cannot be removed."
    );
  }

  const activeVoterCount = voters.filter(
    (voter) => voter.isActive
  ).length;

  if (
    existingVoter.isActive &&
    activeVoterCount <= 1
  ) {
    throw new Error(
      "The last active voter cannot be removed."
    );
  }

  await saveStoredVoters(
    voters.filter(
      (voter) =>
        voter.id !== normalizedVoterId
    )
  );
}