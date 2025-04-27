import React, { useState } from "react";
import Navbar from "./components/Navbar";
import AuthView from "./components/auth/AuthView";
import MriViewer from "./components/models/MriViewer";
import Hero from "./components/Hero";
import FeatureCards from "./components/FeatureCards";
import PatientManagement from "./components/patients/PatientManagement";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const AppContent: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<"home" | "patients" | "models">("home");
  const { isAuthenticated } = useAuth();

  const handleLoginClick = () => {
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleNavigation = (view: "home" | "patients" | "models") => {
    if (!isAuthenticated && (view === "patients" || view === "models")) {
      setShowAuth(true);
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onLoginClick={handleLoginClick}
        onNavigate={handleNavigation}
        currentView={currentView}
      />
      {currentView === 'home' ? (
        <>
          <Hero />
          <FeatureCards />
        </>
      ) : currentView === 'patients' ? (
        isAuthenticated ? (
          <PatientManagement />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">Vui lòng đăng nhập</h2>
              <p className="mt-2 text-gray-500">Bạn cần đăng nhập để truy cập tính năng này</p>
              <button
                onClick={handleLoginClick}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )
      ) : (
        isAuthenticated ? (
          <MriViewer />
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">Vui lòng đăng nhập</h2>
              <p className="mt-2 text-gray-500">Bạn cần đăng nhập để truy cập tính năng này</p>
              <button
                onClick={handleLoginClick}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )
      )}
      <AuthView isOpen={showAuth} onClose={handleCloseAuth} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
