// ================================================
// FILE: src/features/profile/pages/profile-page.tsx
// ProfilePage - User profile page (CLEANED)
// ================================================

import { useState } from 'react';
import { Camera, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layouts/app-layout';
import { PageLayout } from '@/shared/components/common/page-layout';
import { UserAvatar } from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useProfile } from '../hooks/use-profile';
import { ROUTE_PATHS } from '@/shared/constants/route-paths';
import { logger } from '@/shared/utils/logger';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, isLoading, updateProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    about: profile?.about || '',
  });

  const handleSave = async () => {
    try {
      logger.debug('Profile Page: Saving profile...');
      await updateProfile(formData);
      setIsEditing(false);
      logger.success('Profile Page: Profile saved successfully');
    } catch (error) {
      logger.error('Profile Page: Failed to save profile:', error);
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(ROUTE_PATHS.SETTINGS)}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );

  if (!profile) {
    return (
      <AppLayout>
        <PageLayout header={header}>
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </PageLayout>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageLayout header={header}>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <UserAvatar
                src={profile.avatar || profile.profilePhoto}
                name={profile.name}
                size="xl"
              />
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile.name,
                        about: profile.about || '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    placeholder="Write something about yourself..."
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-foreground">{profile.email}</p>
                </div>

                {profile.about && (
                  <div>
                    <Label className="text-muted-foreground">About</Label>
                    <p className="text-foreground">{profile.about}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </AppLayout>
  );
};