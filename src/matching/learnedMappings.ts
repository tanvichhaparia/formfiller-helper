import { LearnedMapping } from '../shared/types';
import { getStorageState, saveStorageState } from '../profile/profileStore';

import { normalizeQuestionText } from './normalization';
export { normalizeQuestionText };

export async function getLearnedMappings(): Promise<Record<string, LearnedMapping>> {
  const state = await getStorageState();
  return state.learnedMappings || {};
}

export async function saveLearnedMapping(
  rawQuestion: string,
  profileFieldKey: string
): Promise<LearnedMapping> {
  const normalized = normalizeQuestionText(rawQuestion);
  const state = await getStorageState();

  if (!state.learnedMappings) {
    state.learnedMappings = {};
  }

  const id = 'mapping_' + Date.now();
  const mapping: LearnedMapping = {
    id,
    questionPattern: normalized,
    profileFieldKey,
    confidence: 0.95,
    createdAt: Date.now()
  };

  state.learnedMappings[normalized] = mapping;
  await saveStorageState(state);
  return mapping;
}

export async function findLearnedMapping(
  rawQuestion: string
): Promise<LearnedMapping | null> {
  const normalized = normalizeQuestionText(rawQuestion);
  const mappings = await getLearnedMappings();

  // Exact match
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Fuzzy substring containment match
  for (const pattern in mappings) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return mappings[pattern];
    }
  }

  return null;
}
