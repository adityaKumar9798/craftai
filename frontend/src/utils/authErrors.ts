/**
 * Formats Firebase authentication errors into user-friendly messages.
 * Returns null if the error should be silently ignored (e.g., user cancelled popup).
 */
export function formatAuthError(error: any): string | null {
  if (!error) return null;

  const code: string = error?.code || '';
  const message: string = error?.message || '';

  // User intentionally closed popup or cancelled request
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup-closed-by-user') ||
    message.includes('cancelled-popup-request')
  ) {
    return null;
  }

  // Popup was blocked by browser
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  // Unverified Email
  if (code === 'auth/unverified-email' || message.includes('not verified') || message.includes('unverified')) {
    return 'Your email address is not verified yet. Please check your inbox and click the verification link before logging in.';
  }

  // Operation not allowed
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'This sign-in method is currently unavailable. Please try another sign-in option.';
  }

  // Domain not authorized
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'Authentication service is momentarily unavailable. Please try again in a moment.';
  }

  // Credentials / Login errors
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    message.includes('invalid-credential') ||
    message.includes('wrong-password') ||
    message.includes('user-not-found')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  // Email already in use
  if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please log in instead.';
  }

  // Weak password
  if (code === 'auth/weak-password' || message.includes('weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  // Invalid email format
  if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }

  // Network error
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection.';
  }

  // Rate limiting
  if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
    return 'Too many attempts. Access is temporarily disabled. Please try again later.';
  }

  // Permission issues
  if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Access limited by database permissions. Please update Firestore rules in Firebase console.';
  }

  // Clean any raw "Firebase: Error (auth/...)" wrapper if unrecognized
  const cleaned = message
    .replace(/^Firebase:\s*Error\s*\((auth\/[^)]+)\)\.?/i, '')
    .replace(/^FirebaseError:\s*/i, '')
    .trim();

  return cleaned || 'Authentication failed. Please try again.';
}
