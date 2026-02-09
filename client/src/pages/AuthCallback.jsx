import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      api
        .setAuthCookie(token)
        .then(() => navigate("/"))
        .catch(() => navigate("/login"));
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
