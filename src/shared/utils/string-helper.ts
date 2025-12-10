// ================================================
// FILE: src/shared/utils/string-helper.ts
// String Manipulation Helpers
// ================================================

export const stringHelper = {
  // Truncate text
  truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  },

  // Get initials from name
  getInitials(name: string, maxChars: number = 2): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, maxChars);
  },

  // Capitalize first letter
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  },

  // Remove special characters
  removeSpecialChars(text: string): string {
    return text.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  // Generate random string
  randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};