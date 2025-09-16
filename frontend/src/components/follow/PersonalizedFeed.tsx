import React, { useState, useEffect } from 'react';
import { Rss } from 'lucide-react';
import { getPersonalizedFeed } from '../../api/follow';
import { PromptCard } from '../prompts/PromptCard';
import type { Prompt } from '../../types';

interface PersonalizedFeedProps {
  className?: string;
}

export const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ className = '' }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchFeed();
  }, [page]);

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const response = await getPersonalizedFeed(page, 20);
      setPrompts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch personalized feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Rss className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your feed is empty
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Follow creators to see their latest prompts in your personalized feed.
          Discover interesting prompt engineers and AI enthusiasts to follow!
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Rss className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Feed</h2>
              <p className="text-sm text-gray-500">
                Latest prompts from creators you follow
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {totalElements} prompts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0 || isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1 || isLoading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};