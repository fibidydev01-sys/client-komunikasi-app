// ================================================
// FILE: src/features/chat/components/new-chat-modal.tsx
// NewChatModal Component - Start new chat
// ================================================

import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { SearchBar } from '@/shared/components/common/search-bar';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { EmptyState } from '@/shared/components/common/empty-state';
import { useChat } from '../hooks/use-chat';
import { useContactStore } from '@/features/contacts/store/contact.store';
import { buildRoute } from '@/shared/constants/route-paths';

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewChatModal = ({
  open,
  onOpenChange,
}: NewChatModalProps) => {
  const navigate = useNavigate();
  const { createChat, isLoading: isCreating } = useChat();
  const { contacts, isLoading: isLoadingContacts } = useContactStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) =>
    contact.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChat = async (contactId: string) => {
    try {
      const chat = await createChat({ participantId: contactId });
      onOpenChange(false);
      navigate(buildRoute.chatDetail(chat.id));
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>
            Select a contact to start a conversation
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <SearchBar
          placeholder="Search contacts..."
          onSearch={setSearchQuery}
        />

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoadingContacts ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner text="Loading contacts..." />
            </div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title={searchQuery ? 'No contacts found' : 'No contacts yet'}
              description={
                searchQuery
                  ? 'Try searching with a different name'
                  : 'Add friends to start chatting'
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleCreateChat(contact.contactId)}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  <UserAvatar
                    src={contact.contact.avatar}
                    name={contact.contact.name}
                    size="md"
                    online={contact.contact.isOnline}
                  />

                  <div className="flex-1 overflow-hidden text-left">
                    <h4 className="truncate font-semibold text-foreground">
                      {contact.nickname || contact.contact.name}
                    </h4>

                    {contact.nickname && (
                      <p className="truncate text-sm text-muted-foreground">
                        {contact.contact.name}
                      </p>
                    )}

                    {contact.contact.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        @{contact.contact.username}
                      </p>
                    )}
                  </div>

                  {isCreating && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};