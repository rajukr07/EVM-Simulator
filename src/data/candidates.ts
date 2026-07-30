export type Candidate = {
  id: string;
  name: string;
  party: string;
  symbol: string;
  isNota?: boolean;
};

export const CANDIDATES: Candidate[] = [
  {
    id: "CANDIDATE001",
    name: "Aditi Mehra",
    party: "Progress Alliance",
    symbol: "PA",
  },
  {
    id: "CANDIDATE002",
    name: "Vikram Rao",
    party: "People's Development Front",
    symbol: "PF",
  },
  {
    id: "CANDIDATE003",
    name: "Neha Kapoor",
    party: "Civic Reform Party",
    symbol: "CR",
  },
  {
    id: "NOTA",
    name: "None of the Above",
    party: "NOTA",
    symbol: "—",
    isNota: true,
  },
];