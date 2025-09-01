import { Calendar, FileText, ChevronRight, Search, Plus, LogOut, Contact } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");  // Clear user data
    navigate('/login');                // Redirect to login page
  };

  console.log("User data in Header:", user);

  return (
    <div className="rounded-tr-3xl border-gray-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-grey-100 px-6 py-4 ">
        {/* Search Bar */}
        <div className="relative">
          {/* <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /> */}
          {/* <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 bg-gray-600 text-white rounded-full text-sm w-64 outline-none"
          /> */}
        </div>

        {/* Right Profile Info */}
        <div className="flex items-center space-x-4">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="text-white w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            {/* <img
              src=""
              alt="User"
              className="w-10 h-10 rounded-full object-cover"
            /> */}
            {/* Safe username access with fallback */}
            <span className="text-white font-medium">{user?.username || "Guest"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
