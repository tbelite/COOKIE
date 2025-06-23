import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cookie, LogOut } from 'lucide-react';
import { User } from '../data/users';

interface WebsiteSettings {
  companyName: string;
  logo: string | null;
  backgroundColor: string;
}

interface HeaderProps {
  websiteSettings: WebsiteSettings;
  user: User;
  logout: () => void;
}

function Header({ websiteSettings, user, logout }: HeaderProps) {
  const { companyName, logo } = websiteSettings;
  const location = useLocation();
  const navigate = useNavigate();

  // Filter menu items based on user permissions
  const getFilteredMenu = () => {
    const allMenuItems = [
      { label: "Dashboard", to: "/", permission: 'viewDashboard' },
      { label: "Tagesübersicht", to: "/tagesinfo", permission: 'viewTagesinfo' },
      { label: "Statistiken", to: "/stats", permission: 'viewStats' },
      { label: "Tageserfassung", to: "/daily", permission: 'dailyTracking' },
      { label: "Inventur", to: "/inventur", permission: 'performInventory' },
      { label: "To-Do & Planung", to: "/todos", permission: 'viewTodos' },
      { label: "Produktionsplanung", to: "/produktionsplanung", permission: 'viewProductionPlanning' },
      { label: "Zutaten", to: "/zutaten", permission: 'viewIngredients' },
      { label: "Einkaufsliste", to: "/einkaufsliste", permission: 'viewShoppingList' },
      { label: "Rezepturen", to: "/rezepturen", permission: 'viewRecipes' },
      { label: "Einstellungen", to: "/settings", permission: 'viewSettings' }
    ];

    return allMenuItems.filter(item => {
      const permission = item.permission as keyof typeof user.permissions;
      return user.permissions[permission];
    });
  };

  const menu = getFilteredMenu();

  return (
    <header className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Logo and Company Name */}
        <div className="flex flex-col items-center py-4 px-4">
          <div className="flex items-center space-x-3 mb-2">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-12 object-contain rounded bg-gray-50 border shadow-sm"
              />
            ) : (
              <div className="p-2 bg-amber-100 rounded-xl">
                <Cookie className="h-8 w-8 text-amber-600" />
              </div>
            )}
            <div className="text-center">
              <div className="font-extrabold text-xl sm:text-2xl text-amber-700 tracking-wide">
                {companyName || "Cookie Business"}
              </div>
              <div className="text-xs text-gray-500">
                Angemeldet als {user.name} ({user.role === 'admin' ? 'Administrator' : 'Mitarbeiter'})
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t bg-gray-50">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 p-2">
            {menu.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-700 hover:bg-amber-100"
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;