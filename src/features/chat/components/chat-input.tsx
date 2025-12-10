// ================================================
// FILE: src/features/chat/components/chat-input.tsx
// ChatInput Component - Message input with media
// ================================================

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

interface ChatInputProps {
  onSend: (content: string, type?: string, image?: string) => void;
  onTyping?: (chatId: string) => void; // FIXED: Accept chatId parameter
  onStopTyping?: (chatId: string) => void; // FIXED: Accept chatId parameter
  disabled?: boolean;
  placeholder?: string;
  chatId?: string; // ADD: chatId prop
}

export const ChatInput = ({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  placeholder = 'Type a message...',
  chatId = '', // ADD: default value
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleChange = (value: string) => {
    setMessage(value);

    // Trigger typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping?.(chatId); // FIXED: Pass chatId
    }

    // Clear previous timeout
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      onStopTyping?.(chatId); // FIXED: Pass chatId
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setMessage('');
    setIsTyping(false);
    onStopTyping?.(chatId); // FIXED: Pass chatId

    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        {/* Media buttons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
          >
            <Image className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={cn(
            'shrink-0',
            message.trim() && 'bg-primary hover:bg-primary/90'
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};