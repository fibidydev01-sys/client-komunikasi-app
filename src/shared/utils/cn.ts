// ================================================
// FILE: src/shared/utils/cn.ts
// Tailwind Class Merge Utility
// ================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
