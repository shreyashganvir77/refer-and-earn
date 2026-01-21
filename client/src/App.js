import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Landing from './pages/Landing';
import WantReferral from './pages/WantReferral';
import GiveReferral from './pages/GiveReferral';
import ProfileCompletion from './pages/ProfileCompletion';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, loading, isProfileComplete } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route
          path="/profile"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <ProfileCompletion />
            )
          }
        />
        <Route 
          path="/" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : loading ? (
              <div className="min-h-screen flex items-center justify-center">Loading…</div>
            ) : !isProfileComplete ? (
              <Navigate to="/profile" replace />
            ) : (
              <Landing />
            )
          }
        />
        <Route 
          path="/want-referral" 
          element={
            isAuthenticated ? <WantReferral /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/give-referral" 
          element={isAuthenticated ? <GiveReferral /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
