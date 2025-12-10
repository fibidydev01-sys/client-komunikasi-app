// ================================================
// FILE: src/features/contacts/components/contact-item.tsx
// ContactItem Component - Single contact item
// ================================================

import { MoreVertical } from 'lucide-react';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type { ContactWithDetails } from '../types/contact.types';

interface ContactItemProps {
  contact: ContactWithDetails;
  onClick?: () => void;
  onBlock?: () => void;
  onRemove?: () => void;
  onEditNickname?: () => void;
}

export const ContactItem = ({
  contact,
  onClick,
  onBlock,
  onRemove,
  onEditNickname,
}: ContactItemProps) => {
  return (
    <div className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
      <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={onClick}>
        <UserAvatar
          src={contact.contact.avatar}
          name={contact.contact.name}
          size="lg"
          online={contact.contact.isOnline}
        />

        <div className="flex-1 overflow-hidden">
          <h4 className="truncate font-semibold text-foreground">
            {contact.nickname || contact.contact.name}
          </h4>

          {contact.nickname && (
            <p className="truncate text-sm text-muted-foreground">
              {contact.contact.name}
            </p>
          )}

          {contact.contact.about && (
            <p className="truncate text-xs text-muted-foreground">
              {contact.contact.about}
            </p>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      {(onBlock || onRemove || onEditNickname) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {onEditNickname && (
              <DropdownMenuItem onClick={onEditNickname}>
                Edit Nickname
              </DropdownMenuItem>
            )}

            {onBlock && (
              <DropdownMenuItem onClick={onBlock}>
                Block Contact
              </DropdownMenuItem>
            )}

            {onRemove && (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive"
              >
                Remove Contact
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};