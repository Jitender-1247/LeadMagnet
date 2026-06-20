/**
 * extensionBridge.js
 * Sends the user's auth token to the StealthLead browser extension
 * (if installed) so the extension popup can connect LinkedIn without
 * requiring the user to log in twice.
 *
 * Silently does nothing if the extension isn't installed — safe to
 * call unconditionally after every successful login.
 */

// Replace with your real extension ID after loading it in chrome://extensions
const EXTENSION_ID = 'fenjjeobikghgpenpeglhfaaabhodbln'

export function notifyExtension(uid, token) {
  if (!uid || !token) return
  if (typeof window === 'undefined' || !window.chrome?.runtime?.sendMessage) return

  try {
    window.chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: 'STEALTHLEAD_AUTH', uid, token },
      (response) => {
        // chrome.runtime.lastError fires if extension isn't installed —
        // this is expected and should be silently ignored
        if (window.chrome.runtime.lastError) return
        if (response?.received) {
          console.log('[StealthLead] Extension synced')
        }
      }
    )
  } catch {
    // Extension not installed or messaging unavailable — ignore
  }
}