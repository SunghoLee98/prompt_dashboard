import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Edit2, Trash2 } from 'lucide-react';
import { ratingApi } from '../../api/rating';
import { useAuth } from '../../contexts/AuthContext';
import { StarRating } from './StarRating';
import { RatingDisplay } from './RatingDisplay';
import { CommentInput } from './CommentInput';
import { Button } from '../common/Button';
import { Card, CardBody } from '../common/Card';

interface RatingSectionProps {
  promptId: number;
  authorId: number;
  className?: string;
}

export const RatingSection: React.FC<RatingSectionProps> = ({
  promptId,
  authorId,
  className = '',
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const isOwner = user?.id === authorId;
  const canRate = user && !isOwner;

  // Fetch rating statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['rating-statistics', promptId],
    queryFn: () => ratingApi.getRatingStatistics(promptId),
  });

  // Fetch user's rating
  const { data: userRating } = useQuery({
    queryKey: ['user-rating', promptId],
    queryFn: () => ratingApi.getUserRating(promptId),
    enabled: !!user && !isOwner,
  });

  // Create rating mutation
  const createMutation = useMutation({
    mutationFn: () => ratingApi.createRating(promptId, { rating, comment: comment || undefined }),
    onSuccess: (data) => {
      queryClient.setQueryData(['rating-statistics', promptId], data.statistics);
      queryClient.setQueryData(['user-rating', promptId], data.rating);
      resetForm();
    },
  });

  // Update rating mutation
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!userRating) return Promise.reject('No rating to update');
      return ratingApi.updateRating(promptId, { rating, comment: comment || undefined });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['rating-statistics', promptId], data.statistics);
      queryClient.setQueryData(['user-rating', promptId], data.rating);
      setIsEditing(false);
      resetForm();
    },
  });

  // Delete rating mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!userRating) return Promise.reject('No rating to delete');
      return ratingApi.deleteRating(promptId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['rating-statistics', promptId], data.statistics);
      queryClient.setQueryData(['user-rating', promptId], null);
      resetForm();
    },
  });

  const resetForm = () => {
    setRating(0);
    setComment('');
    setShowCommentInput(false);
    setIsEditing(false);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    
    if (userRating && isEditing) {
      updateMutation.mutate();
    } else if (!userRating) {
      createMutation.mutate();
    }
  };

  const handleEdit = () => {
    if (userRating) {
      setRating(userRating.rating);
      setComment(userRating.comment || '');
      setShowCommentInput(!!userRating.comment);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (confirm('정말로 평가를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  if (statsLoading) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Card className={className}>
      <CardBody>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            평가
          </h3>

          {/* Rating Statistics */}
          <RatingDisplay statistics={statistics} showDistribution={true} />

          {/* User Rating Section */}
          {canRate && (
            <div className="border-t pt-6">
              {userRating && !isEditing ? (
                // Show existing rating
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StarRating value={userRating.rating} readonly size="md" />
                      <span className="text-sm text-gray-600">내 평가</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        isLoading={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                  {userRating.comment && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{userRating.comment}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Rating form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isEditing ? '평가 수정하기' : '평가하기'}
                    </label>
                    <StarRating
                      value={rating}
                      onChange={setRating}
                      size="lg"
                    />
                  </div>

                  {/* Comment input */}
                  <CommentInput
                    value={comment}
                    onChange={setComment}
                    isVisible={showCommentInput}
                    onToggle={() => setShowCommentInput(!showCommentInput)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    error={comment.length > 1000 ? '코멘트는 1000자를 초과할 수 없습니다.' : undefined}
                  />

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={rating === 0}
                      isLoading={createMutation.isPending || updateMutation.isPending}
                    >
                      {isEditing ? '수정 완료' : '평가 등록'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={resetForm}
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login prompt */}
          {!user && (
            <div className="border-t pt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                로그인하면 이 프롬프트를 평가할 수 있습니다
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/login'}
              >
                로그인하기
              </Button>
            </div>
          )}

          {/* Owner message */}
          {isOwner && (
            <div className="border-t pt-6 text-center">
              <p className="text-sm text-gray-500">
                자신의 프롬프트는 평가할 수 없습니다
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};