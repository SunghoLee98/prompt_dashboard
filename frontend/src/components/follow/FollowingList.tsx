import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { getFollowing } from '../../api/follow';
import { FollowButton } from './FollowButton';
import type { FollowUser } from '../../types';

interface FollowingListProps {
  userId: number;
  currentUserId?: number;
}

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
  currentUserId
}) => {
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchFollowing();
  }, [userId, page]);

  const fetchFollowing = async () => {
    try {
      setIsLoading(true);
      const response = await getFollowing(userId, page);
      setFollowing(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (followingId: number, isFollowing: boolean) => {
    if (!isFollowing && userId === currentUserId) {
      // If current user unfollows someone, remove them from the list
      setFollowing(prev => prev.filter(user => user.id !== followingId));
      setTotalElements(prev => prev - 1);
    } else {
      setFollowing(prev =>
        prev.map(user =>
          user.id === followingId
            ? { ...user, isFollowing }
            : user
        )
      );
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Not following anyone yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Find interesting creators to follow
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Following ({totalElements})
        </h3>
      </div>

      <div className="grid gap-4">
        {following.map(user => (
          <div
            key={user.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Link
                  to={`/users/${user.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user.nickname}
                    </h4>
                    {user.bio && (
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>{user.followerCount} followers</span>
                      <span>{user.followingCount} following</span>
                    </div>
                  </div>
                </Link>
              </div>
              {currentUserId && currentUserId !== user.id && (
                <FollowButton
                  userId={user.id}
                  isFollowing={user.isFollowing !== false}
                  onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                  size="sm"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center px-4">
            <span className="text-sm text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};