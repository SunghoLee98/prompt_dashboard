import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Search, ExternalLink, Star, Heart, Eye, Tag, User, MoreVertical, FolderOpen } from 'lucide-react';
import { getUserBookmarks, moveBookmark } from '../../api/bookmarks';
import type { BookmarkFolder, MoveBookmarkRequest, Bookmark } from '../../types/bookmark';
import type { PageResponse } from '../../types';
import { Card, CardBody } from '../common/Card';

interface BookmarkListProps {
  selectedFolderId?: number;
  folders: BookmarkFolder[];
  onBookmarkMove?: () => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  selectedFolderId,
  folders,
  onBookmarkMove
}) => {
  const [bookmarks, setBookmarks] = useState<PageResponse<Bookmark> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string>('');
  const [movingBookmark, setMovingBookmark] = useState<number | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, [selectedFolderId, search, page]);

  const loadBookmarks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params: any = {
        page,
        size: 20,
        sort: 'createdAt',
        direction: 'desc'
      };

      if (selectedFolderId !== undefined) {
        params.folderId = selectedFolderId;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const data = await getUserBookmarks(params);
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setError('Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadBookmarks();
  };

  const handleMoveBookmark = async (bookmarkId: number, targetFolderId?: number) => {
    setMovingBookmark(bookmarkId);
    try {
      const request: MoveBookmarkRequest = {
        folderId: targetFolderId
      };

      await moveBookmark(bookmarkId, request);
      loadBookmarks();
      onBookmarkMove?.();
    } catch (error) {
      console.error('Failed to move bookmark:', error);
      setError('Failed to move bookmark');
    } finally {
      setMovingBookmark(null);
    }
  };

  const getFolderName = (folderId?: number) => {
    if (!folderId) return 'Uncategorized';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Unknown';
  };

  const getSelectedFolderName = () => {
    if (selectedFolderId === undefined) return 'All Bookmarks';
    if (selectedFolderId === null) return 'Uncategorized';
    return getFolderName(selectedFolderId);
  };

  if (isLoading && !bookmarks) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{getSelectedFolderName()}</h2>
          {bookmarks && (
            <p className="text-gray-600 mt-1">
              {bookmarks.totalElements} bookmark{bookmarks.totalElements !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </form>
        </CardBody>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Bookmarks List */}
      {bookmarks && bookmarks.content.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.content.map((bookmark) => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Title and Link */}
                    <div className="flex items-start gap-2">
                      <Link
                        to={`/prompts/${bookmark.prompt.id}`}
                        className="flex-1 group"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {bookmark.prompt.title}
                        </h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">
                          {bookmark.prompt.description}
                        </p>
                      </Link>
                      <Link
                        to={`/prompts/${bookmark.prompt.id}`}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                        title="View prompt"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Category and Tags */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                        {bookmark.prompt.category}
                      </span>
                      {bookmark.prompt.tags.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Tag className="h-3 w-3" />
                          <span>{bookmark.prompt.tags.slice(0, 3).join(', ')}</span>
                          {bookmark.prompt.tags.length > 3 && (
                            <span>+{bookmark.prompt.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5" />
                        <span>{bookmark.prompt.author.nickname}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {bookmark.prompt.ratingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{bookmark.prompt.averageRating?.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({bookmark.prompt.ratingCount})</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {bookmark.prompt.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {bookmark.prompt.viewCount}
                        </span>
                      </div>
                    </div>

                    {/* Folder and Date */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        <span>{getFolderName(bookmark.folder?.id)}</span>
                      </div>
                      <div>
                        Bookmarked {format(new Date(bookmark.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                      </div>
                    </div>
                  </div>

                  {/* Move Menu */}
                  <div className="relative group">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Move to folder"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="py-1">
                        <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                          Move to folder
                        </div>

                        <button
                          onClick={() => handleMoveBookmark(bookmark.id, undefined)}
                          disabled={movingBookmark === bookmark.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Uncategorized
                        </button>

                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleMoveBookmark(bookmark.id, folder.id)}
                            disabled={movingBookmark === bookmark.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {folder.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Pagination */}
          {bookmarks.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page + 1} of {bookmarks.totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(bookmarks.totalPages - 1, page + 1))}
                disabled={page >= bookmarks.totalPages - 1 || isLoading}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
              <p className="text-gray-500">
                {search.trim()
                  ? `No bookmarks match "${search}"`
                  : selectedFolderId === undefined
                  ? "You haven't bookmarked any prompts yet"
                  : `No bookmarks in ${getSelectedFolderName()}`
                }
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};