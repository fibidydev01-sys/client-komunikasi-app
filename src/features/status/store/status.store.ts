// ================================================
// FILE: src/features/status/store/status.store.ts
// Status Store - Global status state (CLEANED)
// ================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { statusService } from '../services/status.service';
import { toastHelper } from '@/shared/utils/toast-helper';
import { logger } from '@/shared/utils/logger';
import type {
  StatusWithDetails,
  CreateStatusInput,
  UpdateStatusPrivacyInput,
  StatusView
} from '../types/status.types';

interface StatusState {
  // State
  contactsStatuses: StatusWithDetails[];
  myStatuses: StatusWithDetails[];
  activeStatus: StatusWithDetails | null;
  statusViews: StatusView[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchContactsStatuses: () => Promise<void>;
  fetchMyStatuses: () => Promise<void>;
  createStatus: (data: CreateStatusInput) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  viewStatus: (statusId: string) => Promise<void>;
  fetchStatusViews: (statusId: string) => Promise<void>;
  updatePrivacy: (statusId: string, data: UpdateStatusPrivacyInput) => Promise<void>;
  setActiveStatus: (status: StatusWithDetails | null) => void;
  addStatus: (status: StatusWithDetails) => void;

  // Utils
  clearError: () => void;
  reset: () => void;
}

export const useStatusStore = create<StatusState>()(
  devtools(
    (set, get) => ({
      // Initial state
      contactsStatuses: [],
      myStatuses: [],
      activeStatus: null,
      statusViews: [],
      isLoading: false,
      error: null,

      // Fetch contacts' statuses
      fetchContactsStatuses: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Status Store: Fetching contacts statuses...');
          const statuses = await statusService.getContactsStatuses();

          set({ contactsStatuses: statuses, isLoading: false });

          logger.success('Status Store: Contacts statuses fetched:', statuses.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch statuses';

          logger.error('Status Store: Fetch contacts statuses failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Fetch my statuses
      fetchMyStatuses: async () => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Status Store: Fetching my statuses...');
          const statuses = await statusService.getMyStatuses();

          set({ myStatuses: statuses, isLoading: false });

          logger.success('Status Store: My statuses fetched:', statuses.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch my statuses';

          logger.error('Status Store: Fetch my statuses failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Create status
      createStatus: async (data) => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Status Store: Creating status...');
          const status = await statusService.createStatus(data);

          toastHelper.success('Status created successfully!');

          set((state) => ({
            myStatuses: [status, ...state.myStatuses],
            isLoading: false,
          }));

          logger.success('Status Store: Status created');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to create status';

          logger.error('Status Store: Create status failed:', error);
          toastHelper.error(errorMsg);

          set({
            error: errorMsg,
            isLoading: false
          });
          throw error;
        }
      },

      // Delete status
      deleteStatus: async (statusId) => {
        try {
          logger.debug('Status Store: Deleting status:', statusId);
          await statusService.deleteStatus(statusId);

          toastHelper.success('Status deleted successfully');

          set((state) => ({
            myStatuses: state.myStatuses.filter((s) => s.id !== statusId),
            contactsStatuses: state.contactsStatuses.filter((s) => s.id !== statusId),
            activeStatus: state.activeStatus?.id === statusId ? null : state.activeStatus,
          }));

          logger.success('Status Store: Status deleted');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to delete status';

          logger.error('Status Store: Delete status failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // View status
      viewStatus: async (statusId) => {
        try {
          logger.debug('Status Store: Viewing status:', statusId);
          await statusService.markAsViewed(statusId);

          // Update view count
          set((state) => ({
            contactsStatuses: state.contactsStatuses.map((s) =>
              s.id === statusId
                ? { ...s, viewCount: (s.viewCount || 0) + 1 }
                : s
            ),
          }));

          // Silent - no toast for viewing
        } catch (error: any) {
          logger.warn('Status Store: Failed to mark status as viewed:', error);
          // Silent error
        }
      },

      // Fetch status views
      fetchStatusViews: async (statusId) => {
        set({ isLoading: true, error: null });
        try {
          logger.debug('Status Store: Fetching status views:', statusId);
          const views = await statusService.getStatusViews(statusId);

          set({ statusViews: views, isLoading: false });

          logger.success('Status Store: Status views fetched:', views.length);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to fetch views';

          logger.error('Status Store: Fetch status views failed:', error);

          set({
            error: errorMsg,
            isLoading: false
          });

          // Silent error - no toast for background fetch
        }
      },

      // Update privacy
      updatePrivacy: async (statusId, data) => {
        try {
          logger.debug('Status Store: Updating privacy:', statusId);
          const updated = await statusService.updatePrivacy(statusId, data);

          toastHelper.success('Privacy updated successfully');

          set((state) => ({
            myStatuses: state.myStatuses.map((s) =>
              s.id === statusId ? updated : s
            ),
          }));

          logger.success('Status Store: Privacy updated');
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || 'Failed to update privacy';

          logger.error('Status Store: Update privacy failed:', error);
          toastHelper.error(errorMsg);

          set({ error: errorMsg });
          throw error;
        }
      },

      // Set active status
      setActiveStatus: (status) => {
        logger.debug('Status Store: Setting active status:', status?.id);
        set({ activeStatus: status });
      },

      // Add status (from socket)
      addStatus: (status) => {
        logger.debug('Status Store: Adding status from socket:', status.id);
        set((state) => ({
          contactsStatuses: [status, ...state.contactsStatuses],
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        logger.debug('Status Store: Reset');
        set({
          contactsStatuses: [],
          myStatuses: [],
          activeStatus: null,
          statusViews: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    { name: 'StatusStore' }
  )
);