import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, FolderOpen } from 'lucide-react';
import {
  getUserBookmarkFolders,
  createBookmarkFolder,
  updateBookmarkFolder,
  deleteBookmarkFolder
} from '../../api/bookmarks';
import type { BookmarkFolder, CreateBookmarkFolderRequest, UpdateBookmarkFolderRequest } from '../../types/bookmark';
import { Card, CardBody } from '../common/Card';

interface BookmarkFolderManagerProps {
  selectedFolderId?: number;
  onFolderSelect: (folderId?: number) => void;
  onFolderChange?: () => void;
}

export const BookmarkFolderManager: React.FC<BookmarkFolderManagerProps> = ({
  selectedFolderId,
  onFolderSelect,
  onFolderChange
}) => {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<BookmarkFolder | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await getUserBookmarkFolders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
      setError('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const request: CreateBookmarkFolderRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      const newFolder = await createBookmarkFolder(request);
      setFolders([...folders, newFolder]);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to create folder:', error);
      setError('Failed to create folder');
    }
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !formData.name.trim()) return;

    try {
      const request: UpdateBookmarkFolderRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      const updatedFolder = await updateBookmarkFolder(editingFolder.id, request);
      setFolders(folders.map(f => f.id === editingFolder.id ? updatedFolder : f));
      setEditingFolder(null);
      setFormData({ name: '', description: '' });
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to update folder:', error);
      setError('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folder: BookmarkFolder) => {
    if (!confirm(`Are you sure you want to delete "${folder.name}"? Bookmarks in this folder will be moved to uncategorized.`)) {
      return;
    }

    try {
      await deleteBookmarkFolder(folder.id);
      setFolders(folders.filter(f => f.id !== folder.id));
      if (selectedFolderId === folder.id) {
        onFolderSelect(undefined);
      }
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setError('Failed to delete folder');
    }
  };

  const startEditing = (folder: BookmarkFolder) => {
    setEditingFolder(folder);
    setFormData({ name: folder.name, description: folder.description || '' });
    setShowCreateForm(false);
  };

  const cancelEditing = () => {
    setEditingFolder(null);
    setFormData({ name: '', description: '' });
  };

  const startCreating = () => {
    setShowCreateForm(true);
    setEditingFolder(null);
    setFormData({ name: '', description: '' });
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading folders...</div>;
  }

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Bookmark Folders</h3>
            <button
              onClick={startCreating}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Folder
            </button>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* All Bookmarks */}
          <button
            onClick={() => onFolderSelect(undefined)}
            className={`
              w-full flex items-center gap-2 p-3 rounded-md text-left transition-colors
              ${selectedFolderId === undefined
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="font-medium">All Bookmarks</span>
          </button>

          {/* Uncategorized */}
          <button
            onClick={() => onFolderSelect(null as any)}
            className={`
              w-full flex items-center gap-2 p-3 rounded-md text-left transition-colors
              ${selectedFolderId === null
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            <Folder className="h-4 w-4" />
            <span className="font-medium">Uncategorized</span>
          </button>

          {/* Create Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateFolder} className="p-3 bg-gray-50 rounded-md space-y-2">
              <input
                type="text"
                placeholder="Folder name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                maxLength={50}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                maxLength={200}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Folders List */}
          <div className="space-y-2">
            {folders.map((folder) => (
              <div key={folder.id} className="relative">
                {editingFolder?.id === folder.id ? (
                  <form onSubmit={handleUpdateFolder} className="p-3 bg-gray-50 rounded-md space-y-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      maxLength={50}
                      required
                    />
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Description (optional)"
                      maxLength={200}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    className={`
                      flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer
                      ${selectedFolderId === folder.id
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }
                    `}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Folder className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        {folder.description && (
                          <div className="text-xs text-gray-500">{folder.description}</div>
                        )}
                        <div className="text-xs text-gray-400">{folder.bookmarkCount} bookmarks</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(folder);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Edit folder"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {folders.length === 0 && !showCreateForm && (
            <div className="text-center text-gray-500 py-4">
              No folders yet. Create your first folder to organize your bookmarks.
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};