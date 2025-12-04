// ================================================
// FILE: src/features/contacts/store/contact.store.ts
// Contact Store - Global contacts & friend requests state (CLEANED)
// ================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { contactService } from '../services/contact.service';
import { friendRequestService } from '../services/friend-request.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type {
  ContactWithDetails,
  FriendRequestWithDetails,
  SendRequestInput,
  BlockContactInput,
  UpdateNicknameInput
} from '../types/contact.types';

interface ContactState {
  // State
  contacts: ContactWithDetails[];
  blockedContacts: ContactWithDetails[];
  pendingRequests: FriendRequestWithDetails[];
  sentRequests: FriendRequestWithDetails[];
  isLoading: boolean;
  error: string | null;

  // Actions - Contacts
  fetchContacts: () => Promise<void>;
  fetchBlockedContacts: () => Promise<void>;
  blockContact: (data: BlockContactInput) => Promise<void>;
  unblockContact: (data: BlockContactInput) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
  updateNickname: (data: UpdateNicknameInput) => Promise<void>;

  // Actions - Friend Requests
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendRequest: (data: SendRequestInput) => Promise<FriendRequestWithDetails>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  addPendingRequest: (request: FriendRequestWithDetails) => void;
  removePendingRequest: (requestId: string) => void;
  removeSentRequest: (requestId: string) => void;
  addSentRequest: (request: FriendRequestWithDetails) => void;

  // Utils
  clearError: () => void;
  reset: () => void;
}

export const useContactStore = create<ContactState>()(
  devtools(
    (set, get) => ({
      // Initial state
      contacts: [],
      blockedContacts: [],
      pendingRequests: [],
      sentRequests: [],
      isLoading: false,
      error: null,

      // Fetch contacts
      fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Contact Store: Fetching contacts...');
          const contacts = await contactService.getContacts();

          set({
            contacts,
            isLoading: false
          });

          logger.success('Contact Store: Contacts fetched:', contacts.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch contacts';

          logger.error('Contact Store: Fetch contacts failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Fetch blocked contacts
      fetchBlockedContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Contact Store: Fetching blocked contacts...');
          const blockedContacts = await contactService.getBlockedContacts();

          set({
            blockedContacts,
            isLoading: false
          });

          logger.success('Contact Store: Blocked contacts fetched:', blockedContacts.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch blocked contacts';

          logger.error('Contact Store: Fetch blocked contacts failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Block contact
      blockContact: async (data) => {
        try {
          logger.debug('Contact Store: Blocking contact:', data.contactId);
          await contactService.blockContact(data);

          toastHelper.success('Contact blocked successfully');

          set((state) => ({
            contacts: state.contacts.filter((c) => c.contactId !== data.contactId),
          }));

          await get().fetchBlockedContacts();

          logger.success('Contact Store: Contact blocked');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to block contact';

          logger.error('Contact Store: Block contact failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Unblock contact
      unblockContact: async (data) => {
        try {
          logger.debug('Contact Store: Unblocking contact:', data.contactId);
          await contactService.unblockContact(data);

          toastHelper.success('Contact unblocked successfully');

          await get().fetchBlockedContacts();

          logger.success('Contact Store: Contact unblocked');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to unblock contact';

          logger.error('Contact Store: Unblock contact failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Remove contact
      removeContact: async (contactId) => {
        try {
          logger.debug('Contact Store: Removing contact:', contactId);
          await contactService.removeContact(contactId);

          toastHelper.success('Contact removed successfully');

          set((state) => ({
            contacts: state.contacts.filter((c) => c.contactId !== contactId),
          }));

          logger.success('Contact Store: Contact removed');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to remove contact';

          logger.error('Contact Store: Remove contact failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Update nickname
      updateNickname: async (data) => {
        try {
          logger.debug('Contact Store: Updating nickname:', data);
          const updated = await contactService.updateNickname(data);

          toastHelper.success('Nickname updated successfully');

          set((state) => ({
            contacts: state.contacts.map((c) =>
              c.contactId === data.contactId ? updated : c
            ),
          }));

          logger.success('Contact Store: Nickname updated');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to update nickname';

          logger.error('Contact Store: Update nickname failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Fetch pending requests
      fetchPendingRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Contact Store: Fetching pending requests...');
          const requests = await friendRequestService.getPendingRequests();

          set({
            pendingRequests: requests,
            isLoading: false
          });

          logger.success('Contact Store: Pending requests fetched:', requests.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch pending requests';

          logger.error('Contact Store: Fetch pending requests failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Fetch sent requests
      fetchSentRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Contact Store: Fetching sent requests...');
          const requests = await friendRequestService.getSentRequests();

          set({
            sentRequests: requests,
            isLoading: false
          });

          logger.success('Contact Store: Sent requests fetched:', requests.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch sent requests';

          logger.error('Contact Store: Fetch sent requests failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Send friend request
      sendRequest: async (data) => {
        try {
          logger.debug('Contact Store: Sending friend request:', data);
          const request = await friendRequestService.sendRequest(data);

          toastHelper.success('Friend request sent!');

          // Add to sent requests immediately
          set((state) => ({
            sentRequests: [request, ...state.sentRequests],
          }));

          logger.success('Contact Store: Friend request sent');

          return request;
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to send request';

          logger.error('Contact Store: Send request failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Accept request
      acceptRequest: async (requestId) => {
        try {
          logger.debug('Contact Store: Accepting request:', requestId);
          await friendRequestService.acceptRequest(requestId);

          toastHelper.success('Friend request accepted!');

          // Remove from pending requests
          set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          }));

          // Refresh contacts
          await get().fetchContacts();

          logger.success('Contact Store: Request accepted');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to accept request';

          logger.error('Contact Store: Accept request failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Reject request
      rejectRequest: async (requestId) => {
        try {
          logger.debug('Contact Store: Rejecting request:', requestId);
          await friendRequestService.rejectRequest(requestId);

          toastHelper.success('Friend request rejected');

          // Remove from pending requests
          set((state) => ({
            pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
          }));

          logger.success('Contact Store: Request rejected');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to reject request';

          logger.error('Contact Store: Reject request failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Cancel request
      cancelRequest: async (requestId) => {
        try {
          logger.debug('Contact Store: Cancelling request:', requestId);
          await friendRequestService.cancelRequest(requestId);

          toastHelper.success('Friend request cancelled');

          // Remove from sent requests
          set((state) => ({
            sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
          }));

          logger.success('Contact Store: Request cancelled');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to cancel request';

          logger.error('Contact Store: Cancel request failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Add pending request (from socket)
      addPendingRequest: (request) => {
        logger.debug('Contact Store: Adding pending request:', request.id);

        set((state) => ({
          pendingRequests: [request, ...state.pendingRequests],
        }));
      },

      // Remove pending request
      removePendingRequest: (requestId) => {
        logger.debug('Contact Store: Removing pending request:', requestId);

        set((state) => ({
          pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
        }));
      },

      // Remove sent request
      removeSentRequest: (requestId) => {
        logger.debug('Contact Store: Removing sent request:', requestId);

        set((state) => ({
          sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
        }));
      },

      // Add sent request
      addSentRequest: (request) => {
        logger.debug('Contact Store: Adding sent request:', request.id);

        set((state) => ({
          sentRequests: [request, ...state.sentRequests],
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          contacts: [],
          blockedContacts: [],
          pendingRequests: [],
          sentRequests: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    { name: 'ContactStore' }
  )
);