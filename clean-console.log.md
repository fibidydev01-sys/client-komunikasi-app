# 🧹 Console.log Cleanup Plan

## 📋 Overview
Mengganti semua `console.log`, `console.error`, `console.warn` dengan toast notifications menggunakan Sonner untuk UX yang lebih baik.

---

## 📁 Files yang Perlu Dibersihkan

### 🔐 **Auth Related**

#### 1. `src/features/auth/store/auth.store.ts`
**Console Logs:**
- ✅ Login flow (lines 38-46)
- ✅ Register flow (lines 58-66)
- ✅ Logout flow (lines 78-93)
- ✅ Auth check flow (lines 105-122)

**Action:**
- Success: Toast success untuk login/register berhasil
- Error: Toast error untuk gagal login/register
- Info: Toast loading saat checking auth

---

#### 2. `src/features/auth/pages/login-page.tsx`
**Console Logs:**
- ✅ Login attempt (line 43)
- ✅ Login completed (line 45)
- ✅ Login error (line 47)

**Action:**
- Hapus console.log
- Error handling sudah di store

---

#### 3. `src/features/auth/services/auth.service.ts`
**Console Logs:**
- ✅ Register user (lines 23-30)
- ✅ Login user (lines 36-43)
- ✅ Logout (lines 48-56)
- ✅ Auth status (lines 62-68)
- ✅ Token check (line 76)

**Action:**
- Hapus semua console.log
- Error handling via store

---

#### 4. `src/features/auth/hooks/use-auth.ts`
**Console Logs:**
- ✅ Login successful (line 34)
- ✅ Login failed (line 36)
- ✅ Registration successful (line 49)
- ✅ Registration failed (line 51)
- ✅ Logout successful (line 63)
- ✅ Logout failed (line 65)

**Action:**
- Success toast untuk berhasil
- Error toast untuk gagal

---

### 💬 **Chat Related**

#### 5. `src/features/chat/store/chat.store.ts`
**Console Logs:**
- ✅ Fetch chats (lines 53-55)
- ✅ All fetch/create/delete operations
- ✅ Message operations
- ✅ Duplicate message prevention (line 171)

**Action:**
- Success toast untuk create/delete
- Error toast untuk failures
- Silent untuk fetch operations
- Warning toast untuk duplicate prevention

---

#### 6. `src/features/chat/hooks/use-chat.ts`
**Console Logs:**
- ✅ Fetching chats (line 28)
- ✅ Contact/request counts (lines 42-44)
- ✅ Create/delete operations

**Action:**
- Hapus debug logs
- Keep error logs dengan toast

---

#### 7. `src/app/providers/socket-provider.tsx`
**Console Logs:**
- ✅ Socket connection (lines 31-48)
- ✅ Message received (line 41)
- ✅ Typing events (lines 45, 50)

**Action:**
- Hapus debug logs
- Keep critical error logs dengan toast

---

### 📞 **Call Related**

#### 8. `src/features/call/hooks/use-call-socket.ts`
**Console Logs:**
- ✅ Incoming call (line 19)
- ✅ Call answered (line 31)
- ✅ Call rejected (line 43)
- ✅ Call ended (line 55)

**Action:**
- Success toast untuk call events
- Error toast untuk failures

---

### 👥 **Contacts Related**

#### 9. `src/features/contacts/store/contact.store.ts`
**Console Logs:**
- ✅ All fetch operations (lines 53-237)
- ✅ Block/unblock operations
- ✅ Friend request operations

**Action:**
- Success toast untuk actions (add/remove/accept/reject)
- Error toast untuk failures
- Silent untuk fetch operations

---

#### 10. `src/features/contacts/hooks/use-contacts.ts`
**Console Logs:**
- ✅ Initial data fetch (line 42)
- ✅ Friend request events (lines 51-92)

**Action:**
- Success toast untuk friend request accepted
- Info toast untuk friend request received
- Silent untuk fetch operations

---

#### 11. `src/features/contacts/components/add-contact-modal.tsx`
**Console Logs:**
- ✅ Fetching users (lines 39-69)
- ✅ Send friend request (lines 88-94)

**Action:**
- Success toast: "Friend request sent!"
- Error toast dengan pesan error
- Loading state untuk fetch

---

### 📸 **Status Related**

#### 12. `src/features/status/store/status.store.ts`
**Console Logs:**
- ✅ All CRUD operations

**Action:**
- Success toast untuk create/delete status
- Error toast untuk failures
- Silent untuk fetch operations

---

### 🔌 **Socket & API**

#### 13. `src/lib/socket-client.ts`
**Console Logs:**
- ✅ Connection events (lines 26-43)

**Action:**
- Keep critical errors dengan toast
- Hapus debug logs

---

#### 14. `src/lib/axios-client.ts`
**Console Logs:**
- ✅ Request/response logging (lines 26-57)

**Action:**
- Hapus request/response logs
- Keep error logs dengan toast untuk 401

---

### 📊 **User Service**

#### 15. `src/features/user/services/user.service.ts`
**Console Logs:**
- ✅ Get all users (lines 14-41)
- ✅ Get user by ID (lines 46-65)
- ✅ Search user (lines 70-89)

**Action:**
- Hapus debug logs
- Keep error logs dengan toast

---

## 🎯 Implementation Strategy

### **Step 1: Create Toast Utility**
```typescript
// src/shared/utils/toast-helper.ts
import { toast } from 'sonner';

export const toastHelper = {
  success: (message: string) => {
    toast.success(message, { duration: 3000 });
  },
  
  error: (message: string) => {
    toast.error(message, { duration: 4000 });
  },
  
  info: (message: string) => {
    toast.info(message, { duration: 3000 });
  },
  
  warning: (message: string) => {
    toast.warning(message, { duration: 3000 });
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },
  
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};
```

---

### **Step 2: Add Toaster Component**
```typescript
// src/app/App.tsx
import { Toaster } from '@/shared/components/ui/sonner';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppProviders>
  );
}
```

---

### **Step 3: Cleanup Priority**

#### 🔴 **High Priority (User-facing)**
1. ✅ Auth operations (login, register, logout)
2. ✅ Friend requests (send, accept, reject)
3. ✅ Message send/delete
4. ✅ Call events
5. ✅ Status create/delete

#### 🟡 **Medium Priority**
1. ✅ Contact operations
2. ✅ Chat operations
3. ✅ Profile updates

#### 🟢 **Low Priority (Background)**
1. ✅ Fetch operations (silent)
2. ✅ Socket connection logs (only errors)
3. ✅ API request logs (only critical errors)

---

## 📝 Example Implementations

### **1. Auth Store**
```typescript
// Before
console.log('🔐 Auth Store: Starting login...');
console.log('✅ Auth Store: Login API success');

// After
const loadingToast = toastHelper.loading('Signing in...');
try {
  // ... login logic
  toastHelper.dismiss(loadingToast);
  toastHelper.success('Signed in successfully!');
} catch (error) {
  toastHelper.dismiss(loadingToast);
  toastHelper.error(error.message || 'Login failed');
}
```

### **2. Friend Request**
```typescript
// Before
console.log('📤 Sending friend request...');
console.log('✅ Friend request sent');

// After
try {
  await sendRequest(data);
  toastHelper.success('Friend request sent!');
} catch (error) {
  toastHelper.error('Failed to send request');
}
```

### **3. Socket Events**
```typescript
// Before
console.log('📨 Message received:', message);

// After
// Silent - no toast needed
// Only show toast for important events:
toastHelper.info(`New message from ${sender.name}`);
```

---

## ✅ Rules

1. **Success Actions**: Toast dengan icon ✅
2. **Error Actions**: Toast dengan icon ❌ dan detail error
3. **Info Events**: Toast dengan icon ℹ️
4. **Background Operations**: Silent (no toast)
5. **Critical Errors**: Toast + console.error (for debugging)
6. **Loading States**: Use `toast.loading()` dan dismiss setelah selesai

---

## 🚀 Execution Plan

1. Create `toast-helper.ts` utility
2. Add `Toaster` component to App
3. Clean auth-related files
4. Clean chat-related files
5. Clean contacts-related files
6. Clean remaining files
7. Test all user flows
8. Remove development logs

---

## 📊 Progress Tracking

- [ ] Step 1: Create utilities
- [ ] Step 2: Setup Toaster
- [ ] Step 3: Auth cleanup
- [ ] Step 4: Chat cleanup
- [ ] Step 5: Contacts cleanup
- [ ] Step 6: Status cleanup
- [ ] Step 7: Socket cleanup
- [ ] Step 8: API cleanup
- [ ] Step 9: Testing
- [ ] Step 10: Final review

---

**Total Files to Clean**: 15+ files
**Estimated Impact**: Better UX, cleaner console, professional app