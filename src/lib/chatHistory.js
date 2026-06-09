// src/lib/chatHistory.js
// Persists the last active conversation ID so the chat reloads on refresh.
// Messages themselves are stored in Supabase; this is just a lightweight pointer.

const KEY_ACTIVE_CONVO = "asha_active_convo_id";

/**
 * Save the current conversation ID to localStorage.
 * Call this whenever activeConvoId changes to a real value.
 */
export function saveActiveConvoId(id) {
  if (!id) {
    localStorage.removeItem(KEY_ACTIVE_CONVO);
  } else {
    localStorage.setItem(KEY_ACTIVE_CONVO, id);
  }
}

/**
 * Load the last conversation ID from localStorage.
 * Returns null if nothing is stored.
 */
export function loadActiveConvoId() {
  return localStorage.getItem(KEY_ACTIVE_CONVO) || null;
}

/**
 * Clear the stored conversation ID.
 * Call this when starting a new conversation.
 */
export function clearActiveConvoId() {
  localStorage.removeItem(KEY_ACTIVE_CONVO);
}
