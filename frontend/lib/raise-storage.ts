export type RaiseState = 'funding' | 'active' | 'voting' | 'completed' | 'failed';

export type LocalMilestone = {
  id: string;
  description: string;
  percent: number;
  createdAt: string;
  status: 'draft' | 'voting' | 'approved' | 'rejected';
  votesFor: number;
  votesAgainst: number;
};

export type LocalRaise = {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  durationDays: number;
  createdAt: string;
  creator: string;
  state: RaiseState;
  fundingDeadline: string;
  fundsReleased: number;
  totalRaised: number;
  acceptsEth: boolean;
  acceptedToken: 'eth' | 'faucet';
  milestones: LocalMilestone[];
};

const STORAGE_KEY = 'trustlock.raises';
const DRAFT_KEY = 'trustlock.raiseDraft';

const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export const loadRaises = (): Record<string, LocalRaise> => {
  const storage = getStorage();
  if (!storage) return {};
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, LocalRaise>;
  } catch {
    return {};
  }
};

export const saveRaises = (raises: Record<string, LocalRaise>) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(raises));
};

export const getRaise = (id: string) => {
  const raises = loadRaises();
  return raises[id] ?? null;
};

export const upsertRaise = (raise: LocalRaise) => {
  const raises = loadRaises();
  raises[raise.id] = raise;
  saveRaises(raises);
};

export const createRaiseId = () => `raise-${Date.now()}`;

export const loadDraft = () => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<LocalRaise>;
  } catch {
    return null;
  }
};

export const saveDraft = (draft: Partial<LocalRaise>) => {
  const storage = getStorage();
  if (!storage) return;
  const existing = loadDraft() ?? {};
  storage.setItem(DRAFT_KEY, JSON.stringify({ ...existing, ...draft }));
};

export const clearDraft = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(DRAFT_KEY);
};
