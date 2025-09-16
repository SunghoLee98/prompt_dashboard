import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookmarkFolderManager } from '../components/bookmarks/BookmarkFolderManager';
import { BookmarkList } from '../components/bookmarks/BookmarkList';
import { getUserBookmarkFolders } from '../api/bookmarks';
import type { BookmarkFolder } from '../types/bookmark';

export const BookmarksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [foldersKey, setFoldersKey] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadFolders();
    }
  }, [isAuthenticated, foldersKey]);

  const loadFolders = async () => {
    try {
      const data = await getUserBookmarkFolders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleFolderChange = () => {
    setFoldersKey(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bookmarks</h1>
            <p className="text-gray-600 mb-6">
              Please log in to view your bookmarked prompts.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Folder Manager */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookmarkFolderManager
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
                onFolderChange={handleFolderChange}
              />
            </div>
          </div>

          {/* Main Content - Bookmark List */}
          <div className="lg:col-span-3">
            <BookmarkList
              selectedFolderId={selectedFolderId}
              folders={folders}
              onBookmarkMove={handleFolderChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};