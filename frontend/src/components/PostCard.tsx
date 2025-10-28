import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  UserIcon,
  PhotoIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Post } from '../types';
import { formatDateTime, truncate } from '../lib/utils';
import Button from './Button';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

const PostCard = ({ post, onDelete, onPublish }: PostCardProps) => {
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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link to={`/posts/${post.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
            </Link>
            <p className="text-gray-600 mt-2 line-clamp-2">
              {truncate(post.content, 150)}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[post.status]
            }`}
          >
            {statusLabels[post.status]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
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
          {post.assets && post.assets.length > 0 && (
            <div className="flex items-center">
              <PhotoIcon className="h-4 w-4 mr-1" />
              {post.assets.length} Asset(s)
            </div>
          )}
          {post.scheduledAt && (
            <div className="flex items-center text-blue-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDateTime(post.scheduledAt)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {post.platforms.map((platform) => (
            <span
              key={platform}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
            >
              {platform}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Link to={`/posts/${post.id}`}>
            <Button variant="secondary" size="sm">
              Details
            </Button>
          </Link>
          {post.status === 'approved' && onPublish && (
            <Button variant="primary" size="sm" onClick={() => onPublish(post.id)}>
              Veröffentlichen
            </Button>
          )}
          {post.status === 'draft' && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(post.id)}
            >
              Löschen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
