import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Star, Clock, User, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { ratingApi } from '../../api/rating';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Card, CardBody } from '../common/Card';
import { CommentInput } from './CommentInput';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Rating } from '../../types/rating';

interface CommentListProps {
  promptId: number;
  className?: string;
}

export const CommentList: React.FC<CommentListProps> = ({ promptId, className = '' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const pageSize = 10;

  // Fetch ratings with comments
  const { data, isLoading, error } = useQuery({
    queryKey: ['ratings-with-comments', promptId, page],
    queryFn: () => ratingApi.getRatingsWithComments(promptId, {
      page,
      size: pageSize,
      sort: 'createdAt,desc'
    }),
  });

  // Update rating mutation
  const updateMutation = useMutation({
    mutationFn: () => ratingApi.updateRating(promptId, {
      rating: editRating,
      comment: editComment || undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings-with-comments', promptId] });
      queryClient.invalidateQueries({ queryKey: ['rating-statistics', promptId] });
      queryClient.invalidateQueries({ queryKey: ['user-rating', promptId] });
      setEditingId(null);
      setEditRating(0);
      setEditComment('');
    },
  });

  // Delete rating mutation
  const deleteMutation = useMutation({
    mutationFn: () => ratingApi.deleteRating(promptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings-with-comments', promptId] });
      queryClient.invalidateQueries({ queryKey: ['rating-statistics', promptId] });
      queryClient.invalidateQueries({ queryKey: ['user-rating', promptId] });
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleEdit = (rating: Rating) => {
    setEditingId(rating.id);
    setEditRating(rating.rating);
    setEditComment(rating.comment || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleUpdate = () => {
    if (editRating === 0) return;
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('정말로 이 평가를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            리뷰를 불러오는 중 오류가 발생했습니다.
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">아직 작성된 리뷰가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 리뷰를 작성해보세요!</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              사용자 리뷰
              <span className="text-sm font-normal text-gray-500">
                ({data.totalElements}개)
              </span>
            </h3>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            {data.content.map((rating: Rating) => {
              const isOwner = user?.id === rating.userId;
              const isEditing = editingId === rating.id;

              return (
                <div
                  key={rating.id}
                  className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                >
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">평가 수정</label>
                      </div>
                      <StarRating
                        value={editRating}
                        onChange={setEditRating}
                        size="md"
                      />
                      <CommentInput
                        value={editComment}
                        onChange={setEditComment}
                        isVisible={true}
                        showToggle={false}
                        disabled={updateMutation.isPending}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleUpdate}
                          disabled={editRating === 0}
                          isLoading={updateMutation.isPending}
                        >
                          수정 완료
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={updateMutation.isPending}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {rating.userNickname}
                            </span>
                          </div>
                          {renderStars(rating.rating)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(rating.createdAt)}
                          </div>
                          {isOwner && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(rating)}
                                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                title="수정"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleDelete}
                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                title="삭제"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed pl-10">
                          {rating.comment}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                페이지 {data.pageNumber + 1} / {data.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={data.first}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};