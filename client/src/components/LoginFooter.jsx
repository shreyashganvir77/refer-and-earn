import React from "react";
import { useNavigate } from "react-router-dom";

const LoginFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[60px] bg-white flex items-center justify-between px-4 sm:px-6 md:px-12 text-xs sm:text-sm text-gray-500">
      {/* Left side: Platform name and policy links */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="font-medium text-gray-700 whitespace-nowrap">Refer & Earn</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => navigate("/privacy")}
            className="hover:text-gray-700 hover:underline transition-colors focus:outline-none focus:underline"
          >
            Privacy
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => navigate("/terms-and-conditions")}
            className="hover:text-gray-700 hover:underline transition-colors focus:outline-none focus:underline"
          >
            Terms
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => navigate("/about#refund")}
            className="hover:text-gray-700 hover:underline transition-colors focus:outline-none focus:underline"
          >
            Refund
          </button>
        </div>
      </div>

      {/* Right side: Navigation links */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={() => navigate("/about")}
          className="hover:text-gray-700 hover:underline transition-colors focus:outline-none focus:underline"
        >
          About
        </button>
        <button
          onClick={() => navigate("/contact")}
          className="hover:text-gray-700 hover:underline transition-colors focus:outline-none focus:underline"
        >
          Contact
        </button>
      </div>
    </footer>
  );
};

export default LoginFooter;
