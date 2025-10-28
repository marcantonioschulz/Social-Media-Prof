import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usePosts, useDeletePost, usePublishPost } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import Input from '../components/Input';
import type { PostFilters } from '../types';

const PostsPage = () => {
  const [filters, setFilters] = useState<PostFilters>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePosts(filters, { page, limit: 12 });
  const deletePostMutation = useDeletePost();
  const publishPostMutation = usePublishPost();

  const handleDelete = (id: string) => {
    if (confirm('Post wirklich löschen?')) {
      deletePostMutation.mutate(id);
    }
  };

  const handlePublish = (id: string) => {
    if (confirm('Post jetzt veröffentlichen?')) {
      publishPostMutation.mutate(id);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
    setPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      status: e.target.value as any,
    });
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
        <Link to="/posts/create">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Neuer Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Posts durchsuchen..."
            value={filters.search || ''}
            onChange={handleSearch}
          />

          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status || ''}
            onChange={handleStatusFilter}
          >
            <option value="">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="pending_approval">Genehmigung ausstehend</option>
            <option value="approved">Genehmigt</option>
            <option value="rejected">Abgelehnt</option>
            <option value="scheduled">Geplant</option>
            <option value="published">Veröffentlicht</option>
          </select>

          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.platform || ''}
            onChange={(e) => {
              setFilters({ ...filters, platform: e.target.value as any });
              setPage(1);
            }}
          >
            <option value="">Alle Plattformen</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDelete}
                onPublish={handlePublish}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Zurück
              </Button>
              <span className="text-sm text-gray-600">
                Seite {page} von {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 mb-4">Keine Posts gefunden</p>
          <Link to="/posts/create">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Ersten Post erstellen
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PostsPage;
