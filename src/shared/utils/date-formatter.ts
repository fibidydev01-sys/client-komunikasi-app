// ================================================
// FILE: src/shared/utils/date-formatter.ts
// Date Formatting Utilities
// ================================================

import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

export const dateFormatter = {
  // Format for message time (e.g., "14:30" or "Yesterday")
  messageTime(dateString: string): string {
    const date = new Date(dateString);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    }

    if (isYesterday(date)) {
      return 'Yesterday';
    }

    if (isThisWeek(date)) {
      return format(date, 'EEEE');
    }

    return format(date, 'dd/MM/yyyy');
  },

  // Format for chat list (e.g., "14:30" or "01/12")
  chatListTime(dateString: string): string {
    const date = new Date(dateString);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    }

    if (isYesterday(date)) {
      return 'Yesterday';
    }

    return format(date, 'dd/MM/yy');
  },

  // Format for call duration (e.g., "2m 30s")
  callDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs}s`;
    }

    return `${mins}m ${secs}s`;
  },

  // Format for relative time (e.g., "2 hours ago")
  relativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return format(date, 'dd/MM/yyyy');
  },

  // Format full date time (e.g., "January 1, 2024 14:30")
  fullDateTime(dateString: string): string {
    return format(new Date(dateString), 'PPp');
  },
};