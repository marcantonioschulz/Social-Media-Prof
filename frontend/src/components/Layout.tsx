import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useLogout } from '../hooks/useAuth';
import Button from './Button';

const Layout = () => {
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {/* Page title will be set by individual pages */}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              isLoading={logoutMutation.isPending}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Abmelden
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
