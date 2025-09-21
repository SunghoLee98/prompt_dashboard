import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  User,
  Mail,
  Calendar,
  Users,
  UserCheck,
  FileText,
  Loader2
} from 'lucide-react';
import { getUserProfile } from '../api/follow';
import { FollowButton } from '../components/follow/FollowButton';
import { FollowersList } from '../components/follow/FollowersList';
import { FollowingList } from '../components/follow/FollowingList';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';

type TabType = 'prompts' | 'followers' | 'following';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('prompts');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(parseInt(userId));
    }
  }, [userId]);

  const fetchUserProfile = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserProfile(id);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing,
        followerCount: isFollowing
          ? profile.followerCount + 1
          : profile.followerCount - 1
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-600">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.nickname}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {profile.email}
                  </p>
                </div>

                {profile.bio && (
                  <p className="text-gray-600 max-w-lg">{profile.bio}</p>
                )}

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">{profile.promptCount}</span>
                    <span className="text-gray-500">prompts</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('followers')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">{profile.followerCount}</span>
                    <span className="text-gray-500">followers</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('following')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">{profile.followingCount}</span>
                    <span className="text-gray-500">following</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {format(new Date(profile.createdAt), 'MMMM yyyy', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <Link
                  to="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
              ) : (
                currentUser && (
                  <FollowButton
                    userId={profile.id}
                    isFollowing={profile.isFollowing || false}
                    onFollowChange={handleFollowChange}
                  />
                )
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Prompts
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'followers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'following'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Following
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'prompts' && (
          <div className="text-center py-12 text-gray-500">
            User's prompts will be displayed here
          </div>
        )}

        {activeTab === 'followers' && (
          <FollowersList
            userId={profile.id}
            currentUserId={currentUser?.id}
          />
        )}

        {activeTab === 'following' && (
          <FollowingList
            userId={profile.id}
            currentUserId={currentUser?.id}
          />
        )}
      </div>
    </div>
  );
};