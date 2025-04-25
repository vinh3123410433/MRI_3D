import React from 'react';

interface NavbarProps {
  onLoginClick?: () => void;
  onNavigate?: (view: 'home' | 'patients' | 'models') => void;
  currentView?: 'home' | 'patients' | 'models';
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onNavigate, currentView = 'home' }) => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/images/brain-icon.svg"
                alt="Brain Icon"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">MRI 3D</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => onNavigate?.('home')}
                className={`${
                  currentView === 'home'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Trang chủ
              </button>
              <button
                onClick={() => onNavigate?.('patients')}
                className={`${
                  currentView === 'patients'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Quản lý bệnh nhân
              </button>
              <button
                onClick={() => onNavigate?.('models')}
                className={`${
                  currentView === 'models'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Mô hình 3D
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={onLoginClick}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;