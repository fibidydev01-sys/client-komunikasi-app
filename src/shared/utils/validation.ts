// ================================================
// FILE: src/shared/utils/validation.ts
// Form Validation Helpers
// ================================================

export const validation = {
  // Email validation
  email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // Password validation (min 6 chars)
  password(value: string, minLength: number = 6): boolean {
    return value.length >= minLength;
  },

  // Username validation (alphanumeric + underscore)
  username(value: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  },

  // Phone number validation
  phone(value: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(value);
  },

  // URL validation
  url(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // Required field
  required(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  // Min length
  minLength(value: string, min: number): boolean {
    return value.length >= min;
  },

  // Max length
  maxLength(value: string, max: number): boolean {
    return value.length <= max;
  },
};
