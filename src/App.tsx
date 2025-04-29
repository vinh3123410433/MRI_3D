import React, { useState } from "react";
import FeatureCards from "./components/FeatureCards";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import AuthView from "./components/auth/AuthView";
import MriViewer from "./components/models/MriViewer";
// import PatientManagement from "./components/patients/PatientManagement";
// import Hero from "./components/Hero";
// import FeatureCards from "./components/FeatureCards";
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
        <PatientManagement />
      ) : (
      <MriViewer />
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
