import { getStorageState } from '../profile/profileStore';

// Initialize default storage on installation
chrome.runtime.onInstalled.addListener(async () => {
  try {
    await getStorageState();
  } catch (err) {
    console.error('[FormFill Helper] Failed to initialize default storage:', err);
  }
});
