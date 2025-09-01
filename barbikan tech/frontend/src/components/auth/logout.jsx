import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear user-related data (e.g., tokens)
    localStorage.clear();

    // Redirect to login after 2 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-xl text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-2">Logged Out</h1>
        <p className="text-gray-600">You have been successfully logged out.</p>
        <p className="text-sm mt-4 text-gray-500">Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default Logout;
