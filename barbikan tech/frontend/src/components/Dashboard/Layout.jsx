import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size to toggle isMobile flag
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind md breakpoint is 768px
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    // Mobile/Tablet Layout with toggle sidebar
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-black">
        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity md:hidden ${
            sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`
            fixed top-0 left-0 h-full w-72 bg-white shadow-xl border-r border-gray-200
            rounded-tr-3xl rounded-br-3xl overflow-hidden z-50
            transform transition-transform duration-300 ease-in-out
            md:translate-x-0 md:static
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:ml-72 bg-gray-50">
          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-30 bg-black shadow-sm flex items-center justify-between px-4 h-16 md:left-72">
            <button
              className="md:hidden p-2 rounded-md text-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Header />
          </div>

          {/* Main Content Below Header */}
          <main className="pt-16 px-2 md:px-6 h-full overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    );
  }

  // Desktop/Laptop Layout (fixed sidebar, no toggle)
  return (
    <div className="flex h-screen w-screen overflow-hidden p-3 bg-black">
      {/* Sidebar - Fixed */}
      <div className="fixed left-0  pb-3 top-0 h-full w-72 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="ml-72 flex-1 relative">
        {/* Header - Fixed within Main */}
        <div className="fixed top-0 left-72 right-0 z-40 bg-black shadow-sm">
          <Header />
        </div>

        {/* Scrollable Content Below Header */}
        <div className="h-full pt-20 px-1">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default Layout;
