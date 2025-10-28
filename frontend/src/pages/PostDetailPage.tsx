import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { usePost, useDeletePost, usePublishPost } from '../hooks/usePosts';
import { useApprovalByPostId } from '../hooks/useApprovals';
import Button from '../components/Button';
import ApprovalWorkflowStatus from '../components/ApprovalWorkflowStatus';
import { formatDateTime } from '../lib/utils';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading: postLoading } = usePost(id!);
  const { data: approval, isLoading: approvalLoading } = useApprovalByPostId(id!);
  const deletePostMutation = useDeletePost();
  const publishPostMutation = usePublishPost();

  const handleDelete = () => {
    if (confirm('Post wirklich löschen?')) {
      deletePostMutation.mutate(id!, {
        onSuccess: () => navigate('/posts'),
      });
    }
  };

  const handlePublish = () => {
    if (confirm('Post jetzt veröffentlichen?')) {
      publishPostMutation.mutate(id!);
    }
  };

  if (postLoading || approvalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Post nicht gefunden</p>
        <Link to="/posts">
          <Button variant="secondary">Zurück zu Posts</Button>
        </Link>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-purple-100 text-purple-800',
  };

  const statusLabels = {
    draft: 'Entwurf',
    pending_approval: 'Genehmigung ausstehend',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
    scheduled: 'Geplant',
    published: 'Veröffentlicht',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Zurück zu Posts
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[post.status]
                }`}
              >
                {statusLabels[post.status]}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {post.user
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : 'Unbekannt'}
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDateTime(post.createdAt)}
              </div>
              {post.scheduledAt && (
                <div className="flex items-center text-blue-600">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Geplant: {formatDateTime(post.scheduledAt)}
                </div>
              )}
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Plattformen:
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Assets */}
          {post.assets && post.assets.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                Assets ({post.assets.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.assets.map((postAsset) =>
                  postAsset.asset ? (
                    <div
                      key={postAsset.id}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {postAsset.asset.assetType === 'image' && (
                        <img
                          src={postAsset.asset.thumbnailUrl || postAsset.asset.url}
                          alt={postAsset.asset.originalFileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {postAsset.asset.assetType !== 'image' && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <p className="text-sm">{postAsset.asset.assetType}</p>
                        </div>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Aktionen</h2>
            <div className="flex flex-wrap gap-3">
              {post.status === 'approved' && (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  isLoading={publishPostMutation.isPending}
                >
                  Jetzt veröffentlichen
                </Button>
              )}
              {post.status === 'draft' && (
                <>
                  <Link to={`/posts/${post.id}/edit`}>
                    <Button variant="secondary">Bearbeiten</Button>
                  </Link>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    isLoading={deletePostMutation.isPending}
                  >
                    Löschen
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {approval && <ApprovalWorkflowStatus workflow={approval} />}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
