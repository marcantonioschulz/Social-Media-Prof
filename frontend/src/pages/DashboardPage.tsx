import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/api';
import type { DashboardStats } from '../types';
import { formatDateTime } from '../lib/utils';

const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
  });

  const statCards = [
    {
      title: 'Gesamt Posts',
      value: stats?.totalPosts || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Veröffentlicht',
      value: stats?.publishedPosts || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Genehmigungen',
      value: stats?.pendingApprovals || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Assets',
      value: stats?.totalAssets || 0,
      icon: PhotoIcon,
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Letzte Aktivitäten
        </h2>

        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user
                        ? `${activity.user.firstName} ${activity.user.lastName}`
                        : 'Unbekannt'}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {activity.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activity.resourceType} - ID: {activity.resourceId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Keine Aktivitäten vorhanden
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
