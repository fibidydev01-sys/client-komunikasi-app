// ================================================
// FILE: src/app/routes/index.tsx
// Main Application Router (WITHOUT ACTIVE CALL ROUTE - USING MODAL INSTEAD)
// ================================================

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { PublicRoute } from './public-route';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';

// Pages
import {
  LoginPage,
  RegisterPage,
  ChatPage,
  CallsPage,
  ContactsPage,
  StatusPage,
  ProfilePage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTE_PATHS.CHATS} replace />,
  },

  // Public Routes (Guest only)
  {
    path: ROUTE_PATHS.LOGIN,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTE_PATHS.REGISTER,
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },

  // Protected Routes (Authenticated only)
  {
    path: ROUTE_PATHS.CHATS,
    element: (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chats/:chatId',
    element: (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTE_PATHS.CALLS,
    element: (
      <ProtectedRoute>
        <CallsPage />
      </ProtectedRoute>
    ),
  },
  // ❌ REMOVED: Active Call Route (now using modal instead)
  // {
  //   path: ROUTE_PATHS.ACTIVE_CALL,
  //   element: (
  //     <ProtectedRoute>
  //       <ActiveCallPage />
  //     </ProtectedRoute>
  //   ),
  // },
  {
    path: ROUTE_PATHS.CONTACTS,
    element: (
      <ProtectedRoute>
        <ContactsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTE_PATHS.STATUS,
    element: (
      <ProtectedRoute>
        <StatusPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTE_PATHS.PROFILE,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // 404 - Not Found
  {
    path: '*',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-4">Page not found</p>
          <a href="/" className="text-primary hover:underline">
            Go back home
          </a>
        </div>
      </div>
    ),
  },
]);