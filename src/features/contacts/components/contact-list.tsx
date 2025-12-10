// ================================================
// FILE: src/features/contacts/components/contact-list.tsx
// ContactList Component - Display list of contacts
// ================================================

import { Users } from 'lucide-react';
import { ContactItem } from './contact-item';
import { EmptyState } from '@/shared/components/common/empty-state';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { Button } from '@/shared/components/ui/button';
import type { ContactWithDetails } from '../types/contact.types';

interface ContactListProps {
  contacts: ContactWithDetails[];
  isLoading?: boolean;
  onContactClick?: (contactId: string) => void;
  onAddContact?: () => void;
}

export const ContactList = ({
  contacts,
  isLoading,
  onContactClick,
  onAddContact,
}: ContactListProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="Loading contacts..." />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts yet"
        description="Add friends to start chatting"
        action={
          onAddContact && (
            <Button onClick={onAddContact}>
              Add Contact
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="divide-y">
      {contacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          onClick={() => onContactClick?.(contact.contactId)}
        />
      ))}
    </div>
  );
};