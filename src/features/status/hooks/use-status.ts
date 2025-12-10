// ================================================
// FILE: src/features/status/hooks/use-status.ts
// useStatus Hook - Handle status/story logic (CLEANED)
// ================================================

import { useEffect } from 'react';
import { useStatusStore } from '../store/status.store';
import { logger } from '@/shared/utils/logger';
import type { CreateStatusInput, UpdateStatusPrivacyInput } from '../types/status.types';

// ✅ GLOBAL FLAGS (outside React component lifecycle)
let GLOBAL_STATUS_FETCHED = false;

export const useStatus = () => {
  const {
    contactsStatuses,
    myStatuses,
    activeStatus,
    statusViews,
    isLoading,
    error,
    fetchContactsStatuses,
    fetchMyStatuses,
    createStatus,
    deleteStatus,
    viewStatus,
    fetchStatusViews,
    updatePrivacy,
    setActiveStatus,
    clearError,
  } = useStatusStore();

  // ✅ Fetch statuses on mount (ONLY ONCE using global flag)
  useEffect(() => {
    if (!GLOBAL_STATUS_FETCHED) {
      logger.debug('useStatus: Fetching initial data...');
      fetchContactsStatuses();
      fetchMyStatuses();
      GLOBAL_STATUS_FETCHED = true; // ✅ Set global flag
    }
  }, [fetchContactsStatuses, fetchMyStatuses]);

  // Create status
  const handleCreateStatus = async (data: CreateStatusInput) => {
    try {
      logger.debug('useStatus: Creating status...');
      await createStatus(data);
      logger.success('useStatus: Status created successfully');
    } catch (error) {
      logger.error('useStatus: Failed to create status:', error);
      throw error;
    }
  };

  // Delete status
  const handleDeleteStatus = async (statusId: string) => {
    try {
      logger.debug('useStatus: Deleting status:', statusId);
      await deleteStatus(statusId);
      logger.success('useStatus: Status deleted successfully');
    } catch (error) {
      logger.error('useStatus: Failed to delete status:', error);
      throw error;
    }
  };

  // View status
  const handleViewStatus = async (statusId: string) => {
    try {
      logger.debug('useStatus: Viewing status:', statusId);
      await viewStatus(statusId);
      // Silent - no success log for viewing
    } catch (error) {
      logger.warn('useStatus: Failed to view status:', error);
    }
  };

  // Get status views
  const handleFetchStatusViews = async (statusId: string) => {
    try {
      logger.debug('useStatus: Fetching status views:', statusId);
      await fetchStatusViews(statusId);
      logger.success('useStatus: Status views fetched successfully');
    } catch (error) {
      logger.error('useStatus: Failed to fetch status views:', error);
      throw error;
    }
  };

  // Update privacy
  const handleUpdatePrivacy = async (statusId: string, data: UpdateStatusPrivacyInput) => {
    try {
      logger.debug('useStatus: Updating privacy:', statusId);
      await updatePrivacy(statusId, data);
      logger.success('useStatus: Privacy updated successfully');
    } catch (error) {
      logger.error('useStatus: Failed to update privacy:', error);
      throw error;
    }
  };

  return {
    contactsStatuses,
    myStatuses,
    activeStatus,
    statusViews,
    isLoading,
    error,
    createStatus: handleCreateStatus,
    deleteStatus: handleDeleteStatus,
    viewStatus: handleViewStatus,
    fetchStatusViews: handleFetchStatusViews,
    updatePrivacy: handleUpdatePrivacy,
    setActiveStatus,
    clearError,
  };
};

// ✅ EXPORT: Reset function for logout
export const resetStatusFetch = () => {
  GLOBAL_STATUS_FETCHED = false;
  logger.debug('useStatus: Reset fetch flag');
};