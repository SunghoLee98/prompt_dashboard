import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { promptsApi } from '../api/prompts';
import { PromptCard } from '../components/prompts/PromptCard';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const PromptsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '12');
  const sort = searchParams.get('sort') || 'createdAt,desc';
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: promptsApi.getCategories,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['prompts', { page, size, sort, search, category }],
    queryFn: () => promptsApi.getPrompts({ page, size, sort, search, category }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) {
      newParams.set('search', searchInput);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
    }
    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">프롬프트 목록</h1>
        {isAuthenticated && (
          <Button
            onClick={() => navigate('/prompts/new')}
            data-testid="create-prompt-btn"
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            프롬프트 생성
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                name="search"
                placeholder="프롬프트 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10"
                data-testid="search-input"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          <Select
            value={category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            className="md:w-48"
            data-testid="category-filter"
          />

          <Select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            options={[
              { value: 'createdAt,desc', label: '최신순' },
              { value: 'createdAt,asc', label: '오래된순' },
              { value: 'likeCount,desc', label: '인기순' },
              { value: 'viewCount,desc', label: '조회순' },
              { value: 'averageRating,desc', label: '평점순' },
            ]}
            className="md:w-40"
            data-testid="sort-select"
          />
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">프롬프트를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">프롬프트를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="prompt-list">
            {data.content.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={data.first}
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  let pageNum;
                  if (data.totalPages <= 5) {
                    pageNum = i;
                  } else if (page <= 2) {
                    pageNum = i;
                  } else if (page >= data.totalPages - 3) {
                    pageNum = data.totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={data.last}
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">프롬프트가 없습니다.</p>
        </div>
      )}

    </div>
  );
};