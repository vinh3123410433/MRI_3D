import React, { useState } from "react";
import Navbar from "./components/Navbar";
import AuthView from "./components/auth/AuthView";
import MriViewer from "./components/models/MriViewer";
import Hero from "./components/Hero";
import FeatureCards from "./components/FeatureCards";
import PatientManagement from "./components/patients/PatientManagement";

const App: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<"home" | "patients" | "models">("home");

  const handleLoginClick = () => {
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleNavigation = (view: "home" | "patients" | "models") => {
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

export default App;
