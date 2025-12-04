// ================================================
// FILE: src/features/contacts/pages/contacts-page.tsx
// ContactsPage - Contacts and friend requests page (CLEANED)
// ================================================

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { PageLayout } from '@/shared/components/common/page-layout';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ContactList } from '../components/contact-list';
import { FriendRequestItem } from '../components/friend-request-item';
import { AddContactModal } from '../components/add-contact-modal';
import { SearchBar } from '@/shared/components/common/search-bar';
import { useContacts } from '../hooks/use-contacts';
import { logger } from '@/shared/utils/logger';

export const ContactsPage = () => {
  const {
    contacts,
    pendingRequests,
    sentRequests,
    isLoading,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  } = useContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) =>
    contact.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAcceptRequest = async (requestId: string) => {
    try {
      logger.debug('Contacts Page: Accepting request:', requestId);

      await acceptRequest(requestId);

      // Switch to contacts tab to see the new contact
      setActiveTab('contacts');

      logger.success('Contacts Page: Request accepted, switched to contacts tab');
    } catch (error) {
      logger.error('Contacts Page: Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      logger.debug('Contacts Page: Rejecting request:', requestId);

      await rejectRequest(requestId);

      logger.success('Contacts Page: Request rejected');
    } catch (error) {
      logger.error('Contacts Page: Failed to reject request:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      logger.debug('Contacts Page: Cancelling request:', requestId);

      await cancelRequest(requestId);

      logger.success('Contacts Page: Request cancelled');
    } catch (error) {
      logger.error('Contacts Page: Failed to cancel request:', error);
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          {pendingRequests.length > 0 && ` • ${pendingRequests.length} pending`}
        </p>
      </div>
      <Button onClick={() => setShowAddModal(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Contact
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <PageLayout header={header}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts">
              Contacts
              {contacts.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {contacts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {sentRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <SearchBar
              placeholder="Search contacts..."
              onSearch={setSearchQuery}
            />
            <ContactList
              contacts={filteredContacts}
              isLoading={isLoading}
              onAddContact={() => setShowAddModal(true)}
            />
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 inline-flex rounded-full bg-muted p-4">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Friend requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <FriendRequestItem
                    key={request.id}
                    request={request}
                    type="received"
                    onAccept={() => handleAcceptRequest(request.id)}
                    onReject={() => handleRejectRequest(request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 inline-flex rounded-full bg-muted p-4">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Requests you send will appear here
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Find People
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <FriendRequestItem
                    key={request.id}
                    request={request}
                    type="sent"
                    onCancel={() => handleCancelRequest(request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageLayout>

      {/* Add Contact Modal */}
      <AddContactModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </AppLayout>
  );
};