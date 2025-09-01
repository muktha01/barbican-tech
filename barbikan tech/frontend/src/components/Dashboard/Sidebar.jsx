import React from 'react';
import {
  User,
  Droplet,
  Layers,
  Disc,
  ChevronDown,
  ChevronRight,
  User2Icon,
  Factory,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();

  const isGumRoute = location.pathname.startsWith('/gum-ink');
  const isReelRoute = location.pathname.startsWith('/reel-stock');
  const isBoardRoute =
    location.pathname.startsWith('/job-cards') ||
    location.pathname.startsWith('/stockTable') ||
    location.pathname.startsWith('/matter') ||
    location.pathname.startsWith('/companyList');

  const [openReel, setOpenReel] = React.useState(isReelRoute);
  const [openGum, setOpenGum] = React.useState(isGumRoute);
  const [openBoard, setOpenBoard] = React.useState(isBoardRoute);

  return (
    <div className="h-screen bg-white shadow-xl flex flex-col border-r border-gray-200 rounded-tr-3xl rounded-br-3xl overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-6 sticky top-0 bg-white z-10">
          <div className="text-red-600 font-bold text-xl">Barbikan</div>
        </div>

        <nav className="space-y-1 pb-6">
          <NavItem to="/user" label="User" icon={<User2Icon className="w-5 h-5" />} onNavigate={onNavigate} />
          <NavItem to="/factory" label="Factory" icon={<Factory className="w-5 h-5" />} onNavigate={onNavigate} />

          <DropdownItem
            icon={<Layers className="w-5 h-5" />}
            label="Gum & Ink"
            isOpen={openGum}
            onToggle={() => setOpenGum(!openGum)}
          >
            <GumSubLinks onNavigate={onNavigate} />
          </DropdownItem>

          <DropdownItem
            icon={<Disc className="w-5 h-5" />}
            label="Reel Stock"
            isOpen={openReel}
            onToggle={() => setOpenReel(!openReel)}
          >
            <ReelSubLinks onNavigate={onNavigate} />
          </DropdownItem>

          <DropdownItem
            icon={<Disc className="w-5 h-5" />}
            label="Offset"
            isOpen={openBoard}
            onToggle={() => setOpenBoard(!openBoard)}
          >
            <div className="ml-6 mt-2 space-y-2">
              <SidebarLink to="/job-cards" label="Offset Jobcards" onNavigate={onNavigate} />
              <SidebarLink to="/stockTable" label="Offset Stock" onNavigate={onNavigate} />
              <SidebarLink to="/matter" label="Offset Matter" onNavigate={onNavigate} />
              <SidebarLink to="/companyList" label="Offset Company" onNavigate={onNavigate} />
            </div>
          </DropdownItem>

          <NavItem to="/report" label="Report" icon={<Droplet className="w-5 h-5" />} onNavigate={onNavigate} />
        </nav>
      </div>

      <div className="p-4 text-sm text-gray-500 border-t border-gray-100">
        &copy; 2025 Barbikan
      </div>
    </div>
  );
};

// --- NavItem ---
const NavItem = ({ to, icon, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-2 rounded-md cursor-pointer transition 
      text-base font-medium 
      ${isActive ? 'bg-gray-100 text-gray-900 border border-gray-800' : 'text-gray-700 hover:bg-gray-100 hover:text-black'}`
    }
  >
    {icon && <div className="bg-gray-100 p-2 rounded-full">{icon}</div>}
    <span>{label}</span>
  </NavLink>
);

// --- DropdownItem ---
const DropdownItem = ({ icon, label, isOpen, onToggle, children }) => (
  <div>
    <div
      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer transition"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-3">
        <div className="bg-gray-100 p-2 rounded-full text-black">{icon}</div>
        <span className="text-base font-medium text-black">{label}</span>
      </div>
      {onToggle && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
    </div>
    {isOpen && children}
  </div>
);

// --- SidebarLink ---
const SidebarLink = ({ to, label, icon, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-2 rounded-md cursor-pointer transition 
      text-base font-medium 
      ${isActive ? 'bg-gray-100 text-gray-900 border border-gray-800' : 'text-gray-700 hover:bg-gray-100 hover:text-black'}`
    }
  >
    {icon && <div className="bg-gray-100 p-2 rounded-full">{icon}</div>}
    <span>{label}</span>
  </NavLink>
);

// --- Sub Links ---
const ReelSubLinks = ({ onNavigate }) => (
  <div className="ml-6 mt-2 space-y-2">
    <SidebarLink to="/reel-stock/supplier" label="Supplier" onNavigate={onNavigate} />
    <SidebarLink to="/reel-stock/product" label="Product" onNavigate={onNavigate} />
    <SidebarLink to="/reel-stock/purchase" label="Purchase Entry" onNavigate={onNavigate} />
    <SidebarLink to="/reel-stock/usage" label="Usage" onNavigate={onNavigate} />
    <SidebarLink to="/reel-stock/swapping" label="Swapping" onNavigate={onNavigate} />
  </div>
);

const GumSubLinks = ({ onNavigate }) => (
  <div className="ml-6 mt-2 space-y-2">
    <SidebarLink to="/gum-ink/supplier" label="Supplier" onNavigate={onNavigate} />
    <SidebarLink to="/gum-ink/product" label="Product" onNavigate={onNavigate} />
    <SidebarLink to="/gum-ink/purchase" label="Purchase Entry" onNavigate={onNavigate} />
    <SidebarLink to="/gum-ink/usage" label="Usage" onNavigate={onNavigate} />
    <SidebarLink to="/gum-ink/swapping" label="Swapping" onNavigate={onNavigate} />
  </div>
);

export default Sidebar;
