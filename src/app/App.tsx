// ================================================
// FILE: src/app/App.tsx
// Main App Component (WITH TOASTER)
// ================================================

import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner'; // ← ADDED
import { AppProviders } from './providers';
import { router } from './routes';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
      /> {/* ← ADDED */}
    </AppProviders>
  );
}

export default App;