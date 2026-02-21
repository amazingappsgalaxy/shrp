/**
 * Authentication Error Handler Utility
 * Provides consistent error handling and user-friendly messages for auth operations
 */

export interface AuthError {
  message: string;
  code?: string;
  type: 'validation' | 'network' | 'auth' | 'rate_limit' | 'unknown';
}

/**
 * Maps Supabase error messages to user-friendly messages
 */
export function mapAuthError(error: unknown): AuthError {
  if (!error) {
    return {
      message: 'An unexpected error occurred',
      type: 'unknown'
    };
  }

  let errorMessage: string
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    errorMessage = (error as { message: string }).message
  } else {
    errorMessage = String(error)
  }
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (error instanceof TypeError && errorMessage.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      type: 'network'
    };
  }

  // Rate limiting
  if (lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
    return {
      message: 'Too many attempts. Please wait a few minutes before trying again.',
      type: 'rate_limit'
    };
  }

  // Authentication specific errors
  if (lowerMessage.includes('invalid login credentials')) {
    return {
      message: 'Invalid email or password. Please check your credentials and try again.',
      type: 'auth'
    };
  }

  if (lowerMessage.includes('user already registered')) {
    return {
      message: 'An account with this email already exists. Please sign in instead.',
      type: 'auth'
    };
  }

  if (lowerMessage.includes('email not confirmed')) {
    return {
      message: 'Please check your email and click the confirmation link before signing in.',
      type: 'auth'
    };
  }

  if (lowerMessage.includes('user not found')) {
    return {
      message: 'No account found with this email address.',
      type: 'auth'
    };
  }

  if (lowerMessage.includes('invalid session') || lowerMessage.includes('session expired')) {
    return {
      message: 'Your session has expired. Please sign in again.',
      type: 'auth'
    };
  }

  if (lowerMessage.includes('new password should be different')) {
    return {
      message: 'New password must be different from your current password.',
      type: 'validation'
    };
  }

  // Password validation errors
  if (lowerMessage.includes('password should be at least')) {
    return {
      message: 'Password must be at least 6 characters long.',
      type: 'validation'
    };
  }

  // Email validation errors
  if (lowerMessage.includes('invalid email')) {
    return {
      message: 'Please enter a valid email address.',
      type: 'validation'
    };
  }

  // Default fallback
  return {
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    type: 'unknown'
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email?.trim()) {
    return { isValid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty123', 'password123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'Please choose a stronger password' };
  }

  // Check password complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
  }

  return { isValid: true };
}

/**
 * Validates name input
 */
export function validateName(name: string): { isValid: boolean; message?: string } {
  if (!name?.trim()) {
    return { isValid: false, message: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: 'Name must be less than 50 characters' };
  }

  return { isValid: true };
}

/**
 * Comprehensive form validation for sign up
 */
export function validateSignUpForm(email: string, password: string, name: string): {
  isValid: boolean;
  errors: { email?: string; password?: string; name?: string };
} {
  const errors: { email?: string; password?: string; name?: string } = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Comprehensive form validation for sign in
 */
export function validateSignInForm(email: string, password: string): {
  isValid: boolean;
  errors: { email?: string; password?: string };
} {
  const errors: { email?: string; password?: string } = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}