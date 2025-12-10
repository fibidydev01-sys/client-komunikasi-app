// ================================================
// FILE: src/features/contacts/hooks/use-contacts.ts
// useContacts Hook - Handle contacts & friend requests (CLEANED)
// ================================================

import { useEffect } from 'react';
import { useContactStore } from '../store/contact.store';
import { socketClient } from '@/lib/socket-client';
import { SOCKET_EVENTS } from '@/shared/constants/socket-events';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type {
  SendRequestInput,
  BlockContactInput,
  UpdateNicknameInput,
  FriendRequestWithDetails
} from '../types/contact.types';

// ✅ GLOBAL FLAGS (outside React component lifecycle)
let GLOBAL_CONTACTS_FETCHED = false;

export const useContacts = () => {
  const {
    contacts,
    blockedContacts,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchContacts,
    fetchBlockedContacts,
    fetchPendingRequests,
    fetchSentRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    blockContact,
    unblockContact,
    removeContact,
    updateNickname,
    addPendingRequest,
    removePendingRequest,
    removeSentRequest,
    addSentRequest,
    clearError,
  } = useContactStore();

  // ✅ Fetch data on mount (ONLY ONCE using global flag)
  useEffect(() => {
    if (!GLOBAL_CONTACTS_FETCHED) {
      logger.debug('useContacts: Fetching initial data...');

      fetchContacts();
      fetchPendingRequests();
      fetchSentRequests();

      GLOBAL_CONTACTS_FETCHED = true; // ✅ Set global flag

      logger.success('useContacts: Initial data fetch triggered');
    }
  }, [fetchContacts, fetchPendingRequests, fetchSentRequests]);

  // Listen to friend request received
  useEffect(() => {
    const handleRequestReceived = (data: { request: FriendRequestWithDetails }) => {
      logger.info('useContacts: Friend request received from:', data.request.sender.name);

      addPendingRequest(data.request);

      // Show notification toast
      toastHelper.info(`${data.request.sender.name} sent you a friend request`);

      // Optional: Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Friend Request', {
          body: `${data.request.sender.name} sent you a friend request`,
          icon: data.request.sender.avatar || undefined,
        });
      }
    };

    socketClient.on(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, handleRequestReceived);

    return () => {
      socketClient.off(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
    };
  }, [addPendingRequest]);

  // Listen to friend request accepted
  useEffect(() => {
    const handleRequestAccepted = (data: { request: FriendRequestWithDetails }) => {
      logger.success('useContacts: Friend request accepted by:', data.request.receiver.name);

      removeSentRequest(data.request.id);
      fetchContacts(); // Refresh contacts list

      // Show success notification
      toastHelper.success(`${data.request.receiver.name} accepted your friend request!`);

      // Optional: Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Friend Request Accepted', {
          body: `${data.request.receiver.name} accepted your friend request`,
          icon: data.request.receiver.avatar || undefined,
        });
      }
    };

    socketClient.on(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, handleRequestAccepted);

    return () => {
      socketClient.off(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, handleRequestAccepted);
    };
  }, [removeSentRequest, fetchContacts]);

  // Listen to friend request rejected
  useEffect(() => {
    const handleRequestRejected = (data: { request: FriendRequestWithDetails }) => {
      logger.info('useContacts: Friend request rejected by:', data.request.receiver.name);

      removeSentRequest(data.request.id);
    };

    socketClient.on(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED, handleRequestRejected);

    return () => {
      socketClient.off(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED, handleRequestRejected);
    };
  }, [removeSentRequest]);

  // Send friend request
  const handleSendRequest = async (data: SendRequestInput) => {
    try {
      logger.debug('useContacts: Sending friend request to:', data.receiverId);

      const request = await sendRequest(data);

      // Refresh sent requests to show the new one
      await fetchSentRequests();

      logger.success('useContacts: Friend request sent successfully');

      return request;
    } catch (error: any) {
      logger.error('useContacts: Failed to send request:', error);
      throw error;
    }
  };

  // Accept request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      logger.debug('useContacts: Accepting friend request:', requestId);

      await acceptRequest(requestId);

      // Refresh contacts and pending requests
      await fetchContacts();
      await fetchPendingRequests();

      logger.success('useContacts: Friend request accepted successfully');
    } catch (error) {
      logger.error('useContacts: Failed to accept request:', error);
      throw error;
    }
  };

  // Reject request
  const handleRejectRequest = async (requestId: string) => {
    try {
      logger.debug('useContacts: Rejecting friend request:', requestId);

      await rejectRequest(requestId);

      logger.success('useContacts: Friend request rejected successfully');
    } catch (error) {
      logger.error('useContacts: Failed to reject request:', error);
      throw error;
    }
  };

  // Cancel request
  const handleCancelRequest = async (requestId: string) => {
    try {
      logger.debug('useContacts: Cancelling friend request:', requestId);

      await cancelRequest(requestId);

      logger.success('useContacts: Friend request cancelled successfully');
    } catch (error) {
      logger.error('useContacts: Failed to cancel request:', error);
      throw error;
    }
  };

  // Block contact
  const handleBlockContact = async (data: BlockContactInput) => {
    try {
      logger.debug('useContacts: Blocking contact:', data.contactId);

      await blockContact(data);

      logger.success('useContacts: Contact blocked successfully');
    } catch (error) {
      logger.error('useContacts: Failed to block contact:', error);
      throw error;
    }
  };

  // Unblock contact
  const handleUnblockContact = async (data: BlockContactInput) => {
    try {
      logger.debug('useContacts: Unblocking contact:', data.contactId);

      await unblockContact(data);

      logger.success('useContacts: Contact unblocked successfully');
    } catch (error) {
      logger.error('useContacts: Failed to unblock contact:', error);
      throw error;
    }
  };

  // Remove contact
  const handleRemoveContact = async (contactId: string) => {
    try {
      logger.debug('useContacts: Removing contact:', contactId);

      await removeContact(contactId);

      logger.success('useContacts: Contact removed successfully');
    } catch (error) {
      logger.error('useContacts: Failed to remove contact:', error);
      throw error;
    }
  };

  // Update nickname
  const handleUpdateNickname = async (data: UpdateNicknameInput) => {
    try {
      logger.debug('useContacts: Updating nickname:', data);

      await updateNickname(data);

      logger.success('useContacts: Nickname updated successfully');
    } catch (error) {
      logger.error('useContacts: Failed to update nickname:', error);
      throw error;
    }
  };

  return {
    contacts,
    blockedContacts,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    sendRequest: handleSendRequest,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    cancelRequest: handleCancelRequest,
    blockContact: handleBlockContact,
    unblockContact: handleUnblockContact,
    removeContact: handleRemoveContact,
    updateNickname: handleUpdateNickname,
    fetchBlockedContacts,
    clearError,
  };
};

// ✅ EXPORT: Reset function for logout
export const resetContactsFetch = () => {
  GLOBAL_CONTACTS_FETCHED = false;
  logger.debug('useContacts: Reset fetch flag');
};