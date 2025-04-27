import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();

  // Close modal when authentication is successful
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <div className="flex justify-center space-x-6 mb-10">
            <button
              className={`px-8 py-3 text-lg font-medium rounded-lg transition-colors duration-200 ${
                isLogin
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Đăng nhập
            </button>
            <button
              className={`px-8 py-3 text-lg font-medium rounded-lg transition-colors duration-200 ${
                !isLogin
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Đăng ký
            </button>
          </div>
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
};

export default AuthView;