// ================================================
// FILE: src/shared/types/ui-types.ts
// UI Component Types
// ================================================

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type AlertVariant = 'default' | 'destructive';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
}

export interface ModalProps extends DialogProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}
