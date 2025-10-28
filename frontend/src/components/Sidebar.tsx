import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '../hooks/useAuth';

const Sidebar = () => {
  const user = useCurrentUser();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Posts', href: '/posts', icon: DocumentTextIcon },
    { name: 'Neuer Post', href: '/posts/create', icon: PlusCircleIcon },
    { name: 'Assets', href: '/assets', icon: PhotoIcon },
    { name: 'Genehmigungen', href: '/approvals', icon: CheckCircleIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-900 h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-white text-xl font-bold">Social Media Pro</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-4 bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
