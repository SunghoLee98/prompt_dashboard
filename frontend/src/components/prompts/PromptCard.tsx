import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Prompt } from '../../types';
import { Card, CardBody } from '../common/Card';
import { Heart, Eye, Tag, User, Star } from 'lucide-react';
import { BookmarkButton } from '../bookmarks/BookmarkButton';

interface PromptCardProps {
  prompt: Prompt;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  return (
    <Link to={`/prompts/${prompt.id}`} data-testid="prompt-card">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`prompt-card-${prompt.id}`}>
        <CardBody>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {prompt.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {prompt.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                {prompt.category}
              </span>
              {prompt.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{prompt.tags.slice(0, 2).join(', ')}</span>
                  {prompt.tags.length > 2 && (
                    <span>+{prompt.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Link
                to={`/users/${prompt.author.id}`}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <User className="h-3.5 w-3.5" />
                <span>{prompt.author.nickname}</span>
              </Link>

              <div className="flex items-center gap-3 text-sm text-gray-500">
                {prompt.ratingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{prompt.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({prompt.ratingCount})</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {prompt.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {prompt.viewCount}
                </span>
                <BookmarkButton
                  promptId={prompt.id}
                  isBookmarked={prompt.isBookmarked || false}
                  bookmarkCount={prompt.bookmarkCount || 0}
                  size="sm"
                />
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {format(new Date(prompt.createdAt), 'yyyy년 MM월 dd일', {
                locale: ko,
              })}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};