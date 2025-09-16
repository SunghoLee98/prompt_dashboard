import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { promptsApi } from '../api/prompts';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { RatingSection } from '../components/rating/RatingSection';
import { CommentList } from '../components/rating/CommentList';
import { StarRating } from '../components/rating/StarRating';
import { Heart, Eye, Tag, User, Edit, Trash2, Copy, Check } from 'lucide-react';

export const PromptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Debug logging
  console.log('PromptDetailPage rendered with id:', id);
  console.log('ID type:', typeof id);
  console.log('ID is valid number:', id && !isNaN(Number(id)));

  const { data: prompt, isLoading, error } = useQuery({
    queryKey: ['prompt', id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) {
        console.error('Invalid ID:', id);
        throw new Error('Invalid prompt ID');
      }
      
      console.log('Fetching prompt with id:', id);
      console.log('API URL will be:', `/api/prompts/${id}`);
      
      try {
        const result = await promptsApi.getPrompt(Number(id));
        console.log('Prompt fetched successfully:', result);
        console.log('Author info:', result.author);
        console.log('Created at:', result.createdAt);
        return result;
      } catch (error: any) {
        console.error('Error fetching prompt:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        throw error;
      }
    },
    enabled: !!id && !isNaN(Number(id)),
  });

  const likeMutation = useMutation({
    mutationFn: () => promptsApi.toggleLike(Number(id)),
    onSuccess: (data) => {
      queryClient.setQueryData(['prompt', id], (old: any) => ({
        ...old,
        isLiked: data.liked,
        likeCount: data.likeCount,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => promptsApi.deletePrompt(Number(id)),
    onSuccess: () => {
      navigate('/prompts');
    },
  });

  const handleLike = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    likeMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  const handleCopy = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">프롬프트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    console.error('Error state:', error);
    console.log('Prompt data:', prompt);
    console.log('ID param:', id);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const isNetworkError = error instanceof Error && error.message.includes('Network');
    const is404Error = (error as any)?.response?.status === 404;
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">
            {is404Error ? '프롬프트를 찾을 수 없습니다.' : '프롬프트를 불러오는 중 오류가 발생했습니다.'}
          </p>
          {error && (
            <div className="text-gray-500 text-sm mb-4">
              <p>오류: {errorMessage}</p>
              {isNetworkError && <p className="mt-2">네트워크 연결을 확인해주세요.</p>}
              <p className="mt-2 text-xs">ID: {id}</p>
            </div>
          )}
          <Button variant="outline" className="mt-4" onClick={() => navigate('/prompts')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id && prompt.author?.id && user.id === prompt.author.id;
  
  console.log('Current user:', user);
  console.log('Prompt author:', prompt.author);
  console.log('Is owner:', isOwner);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt.title}</h1>
              <p className="text-gray-600 mb-4">{prompt.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{prompt.author?.nickname || '익명'}</span>
                </div>
                {(prompt.ratingCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <StarRating value={prompt.averageRating ?? 0} readonly size="sm" />
                    <span className="ml-1">({prompt.ratingCount ?? 0})</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{prompt.viewCount ?? 0} 조회</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={`h-4 w-4 ${prompt.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{prompt.likeCount ?? 0} 좋아요</span>
                </div>
                <span>
                  {prompt.createdAt ? format(new Date(prompt.createdAt), 'yyyy년 MM월 dd일 HH:mm', {
                    locale: ko,
                  }) : '날짜 정보 없음'}
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Link to={`/prompts/${id}/edit`}>
                  <Button variant="outline" size="sm" data-testid="edit-prompt-btn">
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                  data-testid="delete-prompt-btn"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-6">
            {/* Category and Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {prompt.category && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {prompt.category}
                </span>
              )}
              {prompt.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-6 relative">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {prompt.content}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow"
                title="복사하기"
                data-testid="copy-prompt-btn"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant={prompt.isLiked ? 'primary' : 'outline'}
                onClick={handleLike}
                isLoading={likeMutation.isPending}
                className="flex items-center"
                data-testid="like-prompt-btn"
              >
                <Heart className={`h-4 w-4 mr-1 ${prompt.isLiked ? 'fill-white' : ''}`} />
                {prompt.isLiked ? '좋아요 취소' : '좋아요'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/prompts')}
              >
                목록으로
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rating Section */}
      {prompt.id && prompt.author?.id && (
        <RatingSection
          promptId={prompt.id}
          authorId={prompt.author.id}
          className="mt-6"
        />
      )}

      {/* Comments List */}
      {prompt.id && (
        <CommentList
          promptId={prompt.id}
          className="mt-6"
        />
      )}
    </div>
  );
};