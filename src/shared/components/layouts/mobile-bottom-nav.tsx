// ================================================
// FILE: src/shared/components/layouts/mobile-bottom-nav.tsx
// MobileBottomNav Component - Mobile bottom navigation
// ================================================

import { NavLink } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Users,
  Camera,
  User
} from 'lucide-react';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { cn } from '@/shared/utils/cn';

const navItems = [
  { path: ROUTE_PATHS.CHATS, icon: MessageCircle, label: 'Chats' },
  { path: ROUTE_PATHS.STATUS, icon: Camera, label: 'Status' },
  { path: ROUTE_PATHS.CALLS, icon: Phone, label: 'Calls' },
  { path: ROUTE_PATHS.CONTACTS, icon: Users, label: 'Contacts' },
  { path: ROUTE_PATHS.PROFILE, icon: User, label: 'Profile' },
];

export const MobileBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 px-3 transition-colors',
                'hover:text-primary',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};