// ================================================
// FILE: src/features/contacts/components/add-contact-modal.tsx
// AddContactModal Component - Add new contact (CLEANED)
// ================================================

import { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { LoadingSpinner } from '@/shared/components/common/loading-spinner';
import { EmptyState } from '@/shared/components/common/empty-state';
import { useContacts } from '../hooks/use-contacts';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { userService } from '@/features/user/services/user.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type { User } from '@/shared/types/user-types';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddContactModal = ({
  open,
  onOpenChange,
}: AddContactModalProps) => {
  const { user: currentUser } = useAuthStore();
  const { sendRequest, contacts } = useContacts();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users when modal opens
  useEffect(() => {
    if (open) {
      fetchAllUsers();
    }
  }, [open]);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Add Contact Modal: Fetching all users...');

      const response = await userService.getAllUsers();
      const users = Array.isArray(response) ? response : [];

      if (users.length === 0) {
        logger.warn('Add Contact Modal: No users returned from API');
        setError('No users found. Please make sure backend is returning user list.');
      }

      // Filter out current user and existing contacts
      const contactIds = contacts.map(c => c.contactId);
      const filteredUsers = users.filter(
        u => u.id !== currentUser?.id && !contactIds.includes(u.id)
      );

      logger.success('Add Contact Modal: Users fetched and filtered:', filteredUsers.length);

      setAllUsers(filteredUsers);

      if (filteredUsers.length === 0 && users.length > 0) {
        setError('All available users are already in your contacts.');
      }
    } catch (error: any) {
      logger.error('Add Contact Modal: Failed to fetch users:', error);

      const errorMsg = error.response?.data?.message ||
        error.message ||
        'Failed to load users. Please check backend connection.';

      setError(errorMsg);
      toastHelper.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);

    try {
      logger.debug('Add Contact Modal: Sending friend request to:', userId);

      await sendRequest({ receiverId: userId });

      // Remove user from list after sending request
      setAllUsers(prev => prev.filter(u => u.id !== userId));

      logger.success('Add Contact Modal: Friend request sent successfully');
    } catch (error: any) {
      logger.error('Add Contact Modal: Failed to send friend request:', error);

      const errorMsg = error.response?.data?.message || 'Failed to send request';
      toastHelper.error(errorMsg);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Find and add people to your contacts
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAllUsers}
            disabled={isLoading}
            title="Refresh"
          >
            <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner text="Loading users..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={
                error
                  ? 'Failed to load users'
                  : searchQuery
                    ? 'No users found'
                    : 'No available users'
              }
              description={
                error
                  ? 'Please check your backend connection'
                  : searchQuery
                    ? 'Try searching with a different name'
                    : 'All available users have been added'
              }
              action={
                error && (
                  <Button onClick={fetchAllUsers}>
                    Try Again
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    size="lg"
                    online={user.isOnline}
                  />

                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate font-semibold text-foreground">
                      {user.name}
                    </h4>

                    {user.username && (
                      <p className="truncate text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    )}

                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>

                    {user.about && (
                      <p className="truncate text-xs text-muted-foreground mt-1">
                        {user.about}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sendingTo === user.id}
                  >
                    {sendingTo === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};