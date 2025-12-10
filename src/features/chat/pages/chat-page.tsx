// ================================================
// FILE: src/features/chat/pages/chat-page.tsx
// ChatPage - Main chat page with list and room (UPDATED)
// ================================================

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { ChatLayout } from '@/shared/components/layouts/chat-layout';
import { SearchBar } from '@/shared/components/common/search-bar';
import { Button } from '@/shared/components/ui/button';
import { ChatList } from '../components/chat-list';
import { ChatRoom } from '../components/chat-room';
import { NewChatModal } from '../components/new-chat-modal';
import { useChat } from '../hooks/use-chat';

export const ChatPage = () => {
  const { chatId } = useParams();
  const { chats, isLoading } = useChat(chatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    // Filter by participant name or group name
    return chat.participants.some((p) =>
      p.name.toLowerCase().includes(searchLower)
    ) || chat.groupName?.toLowerCase().includes(searchLower);
  });

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Chats</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowNewChatModal(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <SearchBar
          placeholder="Search chats..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          chats={filteredChats}
          isLoading={isLoading}
          onNewChat={() => setShowNewChatModal(true)}
        />
      </div>
    </div>
  );

  const main = chatId ? (
    <ChatRoom />
  ) : (
    <div className="flex h-full items-center justify-center text-center p-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select a chat</h2>
        <p className="text-muted-foreground mb-4">
          Choose a conversation from the list to start messaging
        </p>
        <Button onClick={() => setShowNewChatModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Start New Chat
        </Button>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <ChatLayout
        sidebar={sidebar}
        main={main}
        showSidebar={!chatId}
      />

      {/* New Chat Modal */}
      <NewChatModal
        open={showNewChatModal}
        onOpenChange={setShowNewChatModal}
      />
    </AppLayout>
  );
};