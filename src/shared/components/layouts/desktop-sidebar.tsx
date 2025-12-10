// ================================================
// FILE: src/shared/components/layouts/desktop-sidebar.tsx
// DesktopSidebar Component - Desktop navigation sidebar
// ================================================

import { NavLink } from 'react-router-dom';
import {
  MessageCircle,
  Phone,
  Users,
  Camera,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { cn } from '@/shared/utils/cn';

const navItems = [
  { path: ROUTE_PATHS.CHATS, icon: MessageCircle, label: 'Chats' },
  { path: ROUTE_PATHS.STATUS, icon: Camera, label: 'Status' },
  { path: ROUTE_PATHS.CALLS, icon: Phone, label: 'Calls' },
  { path: ROUTE_PATHS.CONTACTS, icon: Users, label: 'Contacts' },
];

export const DesktopSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-20 flex-col items-center gap-4 border-r bg-background py-4">
      {/* Logo */}
      <div className="mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                'hover:bg-muted',
                isActive && 'bg-muted text-primary'
              )
            }
          >
            <item.icon className="h-6 w-6" />
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-12 w-12 rounded-full p-0"
          >
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'User'}
              size="md"
              online={user?.isOnline}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="right" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <UserAvatar
              src={user?.avatar}
              name={user?.name || 'User'}
              size="sm"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-semibold text-sm">
                {user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <NavLink to={ROUTE_PATHS.PROFILE} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </NavLink>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <NavLink to={ROUTE_PATHS.SETTINGS} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </NavLink>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
};