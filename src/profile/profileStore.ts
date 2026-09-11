import { Profile, ProfileField, ProfileType, StorageSchema, FieldCategory } from '../shared/types';
import { getDefaultStorageState, PREDEFINED_FIELDS } from './defaultFields';

const STORAGE_KEY = 'formfill_helper_data';

// Helper to check if running in Chrome extension context
function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
}

/**
 * Retrieves entire storage schema, auto-initializing with defaults if empty.
 */
export async function getStorageState(): Promise<StorageSchema> {
  const defaults = getDefaultStorageState();

  if (hasChromeStorage()) {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const data = result[STORAGE_KEY] as StorageSchema | undefined;

      if (!data || !data.profiles || Object.keys(data.profiles).length === 0) {
        await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
        return defaults;
      }

      // Ensure all predefined fields exist in each profile (for schema migration resilience)
      let modified = false;
      for (const profId in data.profiles) {
        const prof = data.profiles[profId];
        if (!prof.fields) {
          prof.fields = {};
          modified = true;
        }
        for (const def of PREDEFINED_FIELDS) {
          if (!prof.fields[def.key]) {
            prof.fields[def.key] = {
              id: def.key,
              key: def.key,
              label: def.label,
              value: '',
              category: def.category,
              enabled: true,
              isCustom: false
            };
            modified = true;
          }
        }
      }

      if (modified) {
        await chrome.storage.local.set({ [STORAGE_KEY]: data });
      }

      return data;
    } catch (err) {
      console.error('[profileStore] Error reading chrome.storage.local:', err);
      return defaults;
    }
  } else {
    // Fallback to localStorage or in-memory map for dev/test environments
    const storage = getFallbackStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    try {
      return JSON.parse(raw) as StorageSchema;
    } catch {
      return defaults;
    }
  }
}

const inMemoryFallback = new Map<string, string>();

function getFallbackStorage(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.getItem('__test__');
      return window.localStorage;
    }
  } catch {}
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      (globalThis as any).localStorage.getItem('__test__');
      return (globalThis as any).localStorage;
    }
  } catch {}
  return {
    getItem: (k: string) => inMemoryFallback.get(k) || null,
    setItem: (k: string, v: string) => inMemoryFallback.set(k, v)
  };
}

/**
 * Persists the entire storage schema.
 */
export async function saveStorageState(state: StorageSchema): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } else {
    const storage = getFallbackStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const EventCtor = window.CustomEvent || (typeof CustomEvent !== 'undefined' ? CustomEvent : null);
        if (EventCtor) {
          window.dispatchEvent(new EventCtor('formfill_storage_changed', { detail: state }));
        }
      } catch {}
    }
  }
}

/**
 * Returns the currently active profile.
 */
export async function getActiveProfile(): Promise<Profile> {
  const state = await getStorageState();
  const activeId = state.activeProfileId;
  if (state.profiles[activeId]) {
    return state.profiles[activeId];
  }
  const firstId = Object.keys(state.profiles)[0];
  return state.profiles[firstId];
}

/**
 * Changes active profile ID.
 */
export async function setActiveProfile(profileId: string): Promise<void> {
  const state = await getStorageState();
  if (state.profiles[profileId]) {
    state.activeProfileId = profileId;
    await saveStorageState(state);
  }
}

/**
 * Updates the value of a specific field (standard or custom) in a profile.
 */
export async function updateFieldValue(
  profileId: string,
  fieldKey: string,
  value: string
): Promise<void> {
  const state = await getStorageState();
  const profile = state.profiles[profileId];
  if (!profile) return;

  if (profile.fields[fieldKey]) {
    profile.fields[fieldKey].value = value;
  } else {
    profile.fields[fieldKey] = {
      id: fieldKey,
      key: fieldKey,
      label: fieldKey,
      value: value,
      category: 'custom',
      isCustom: true,
      enabled: true
    };
  }
  profile.updatedAt = Date.now();
  await saveStorageState(state);
}

/**
 * Adds a new custom field to a profile.
 */
export async function addCustomField(
  profileId: string,
  customField: {
    name: string;
    value: string;
    category?: FieldCategory;
    aliases?: string[];
    description?: string;
    isSensitive?: boolean;
  }
): Promise<ProfileField> {
  const state = await getStorageState();
  const profile = state.profiles[profileId];
  if (!profile) {
    throw new Error(`Profile with id "${profileId}" not found`);
  }

  const sanitizedKey =
    'custom_' + customField.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
  const newField: ProfileField = {
    id: sanitizedKey,
    key: sanitizedKey,
    label: customField.name.trim(),
    value: customField.value,
    category: customField.category || 'custom',
    isCustom: true,
    isSensitive: Boolean(customField.isSensitive),
    aliases: customField.aliases || [],
    description: customField.description,
    enabled: true,
    source: 'custom'
  };

  profile.fields[sanitizedKey] = newField;
  profile.updatedAt = Date.now();
  await saveStorageState(state);
  return newField;
}

/**
 * Deletes a custom field from a profile.
 */
export async function deleteCustomField(profileId: string, fieldId: string): Promise<void> {
  const state = await getStorageState();
  const profile = state.profiles[profileId];
  if (!profile || !profile.fields[fieldId]) return;

  delete profile.fields[fieldId];
  profile.updatedAt = Date.now();
  await saveStorageState(state);
}

/**
 * Toggles a field enabled/disabled status.
 */
export async function toggleFieldEnabled(
  profileId: string,
  fieldId: string,
  enabled: boolean
): Promise<void> {
  const state = await getStorageState();
  const profile = state.profiles[profileId];
  if (!profile || !profile.fields[fieldId]) return;

  profile.fields[fieldId].enabled = enabled;
  profile.updatedAt = Date.now();
  await saveStorageState(state);
}

/**
 * Creates a brand new custom profile.
 */
export async function createProfile(name: string, type: ProfileType = 'custom'): Promise<Profile> {
  const state = await getStorageState();
  const profileId = 'profile_' + Date.now();
  const defaults = getDefaultStorageState();
  const baseFields = defaults.profiles['profile_personal'].fields;

  // Clone base empty fields
  const clonedFields: Record<string, ProfileField> = {};
  for (const k in baseFields) {
    clonedFields[k] = { ...baseFields[k], value: '' };
  }

  const newProfile: Profile = {
    id: profileId,
    name: name.trim(),
    type,
    isDefault: false,
    fields: clonedFields,
    updatedAt: Date.now()
  };

  state.profiles[profileId] = newProfile;
  state.activeProfileId = profileId;
  await saveStorageState(state);
  return newProfile;
}

/**
 * Deletes a profile (cannot delete if it is the only remaining profile).
 */
export async function deleteProfile(profileId: string): Promise<boolean> {
  const state = await getStorageState();
  const profileKeys = Object.keys(state.profiles);
  if (profileKeys.length <= 1) {
    return false; // Prevent deleting last profile
  }

  delete state.profiles[profileId];
  if (state.activeProfileId === profileId) {
    state.activeProfileId = Object.keys(state.profiles)[0];
  }
  await saveStorageState(state);
  return true;
}

/**
 * Listens for external changes to storage (e.g. options page editing updates popup).
 */
export function subscribeToStorageChanges(callback: (state: StorageSchema) => void): () => void {
  if (hasChromeStorage()) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue as StorageSchema;
        if (newValue) {
          callback(newValue);
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  } else {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<StorageSchema>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };
    window.addEventListener('formfill_storage_changed', handler);
    return () => window.removeEventListener('formfill_storage_changed', handler);
  }
}

/**
 * Calculates number of filled fields in a profile.
 */
export function countFilledFields(profile: Profile): { filled: number; total: number } {
  const fields = Object.values(profile.fields);
  const total = fields.length;
  const filled = fields.filter(f => f.value && f.value.trim().length > 0 && f.enabled).length;
  return { filled, total };
}
