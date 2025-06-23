import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, AlertTriangle, Cookie, Plus, Minus, RefreshCw, DollarSign, ShoppingCart, Calculator, Eye, Calendar, BarChart3, Settings, LogOut, TrendingUp, Truck, ClipboardCheck, CheckSquare, Clock, Upload } from 'lucide-react';
import { User } from '../data/users';
import CSVUpload from './CSVUpload';

interface DailyData {
  sold: number;
  prepared: number;
  used: number;
  trash: number;
  new: number;
}

interface CookieData {
  id: number;
  name: string;
  sold: number;
  stock: number;
  prepared: number;
  price: number;
  category: string;
  history: Record<string, DailyData>;
}

interface WebsiteSettings {
  companyName: string;
  logo: string | null;
  backgroundColor: string;
  textColor: string;
  buttonBgColor: string;
}

interface DashboardProps {
  cookies: CookieData[];
  updateCookies: (cookies: CookieData[]) => void;
  user: User;
  logout: () => void;
  websiteSettings: WebsiteSettings;
}

// Helper function for German date formatting
function formatGermanDate(date = new Date()) {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Helper function to load todos
const loadToDos = () => {
  try {
    return JSON.parse(localStorage.getItem("cookieToDos") || "[]");
  } catch {
    return [];
  }
};

function Dashboard({ cookies, updateCookies, user, logout, websiteSettings }: DashboardProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  // Load todos for notification
  const toDos = loadToDos();
  const openToDos = toDos.filter((td: any) => !td.done);

  const categories = ['All', ...Array.from(new Set(cookies.map(cookie => cookie.category)))];

  const filteredCookies = useMemo(() => {
    return cookies.filter(cookie => {
      const matchesSearch = cookie.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || cookie.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cookies, searchTerm, selectedCategory]);

  const totalStats = useMemo(() => {
    return cookies.reduce((acc, cookie) => ({
      totalSold: acc.totalSold + cookie.sold,
      totalStock: acc.totalStock + cookie.stock,
      totalPrepared: acc.totalPrepared + cookie.prepared,
      totalRevenue: acc.totalRevenue + (cookie.sold * cookie.price)
    }), { totalSold: 0, totalStock: 0, totalPrepared: 0, totalRevenue: 0 });
  }, [cookies]);

  const lowStockCount = cookies.filter(cookie => cookie.stock < 20).length;

  const updateStock = (id: number, type: 'stock' | 'prepared', delta: number) => {
    const updatedCookies = cookies.map(cookie => 
      cookie.id === id 
        ? { ...cookie, [type]: Math.max(0, cookie[type] + delta) }
        : cookie
    );
    updateCookies(updatedCookies);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Kritisch' };
    if (stock < 20) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Niedrig' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Gut' };
  };

  const getTodayData = (cookie: CookieData) => {
    const today = new Date().toISOString().split('T')[0];
    return cookie.history[today] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0 };
  };

  // Update cookie day function for CSV upload
  const updateCookieDay = (cookieId: number, values: Partial<DailyData>, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    updateCookies(cookies =>
      cookies.map(cookie => {
        if (cookie.id !== cookieId) return cookie;
        const dayData = cookie.history[targetDate] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0 };
        return {
          ...cookie,
          history: {
            ...cookie.history,
            [targetDate]: { ...dayData, ...values },
          },
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Current Date Display */}
        <div className="text-center mb-6">
          <div className="text-gray-600 font-medium text-base sm:text-lg">
            {formatGermanDate()}
          </div>
        </div>

        {/* ToDo Notification Banner */}
        {openToDos.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/todos')}
              className="w-full flex items-center gap-3 bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-amber-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-sm hover:from-amber-200 hover:to-orange-200 transition-all duration-200 group"
            >
              <div className="p-2 bg-amber-500 rounded-lg text-white">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-amber-800 text-sm sm:text-base">
                  {openToDos.length} offene Aufgabe{openToDos.length > 1 ? "n" : ""}
                </div>
                <div className="text-amber-700 text-xs sm:text-sm">
                  {openToDos.slice(0, 2).map((td: any) => td.text).join(" • ")}
                  {openToDos.length > 2 && " ..."}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium group-hover:text-amber-700">
                  Zu den Aufgaben
                </span>
              </div>
            </button>
          </div>
        )}

        {/* CSV Upload Toggle */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => setShowCSVUpload(!showCSVUpload)}
            className={`w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-sm transition-all duration-200 ${
              showCSVUpload 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="font-medium">
              {showCSVUpload ? 'CSV-Import schließen' : 'CSV-Import: Verkaufsdaten hochladen'}
            </span>
          </button>
        </div>

        {/* CSV Upload Component */}
        {showCSVUpload && (
          <div className="mb-6 sm:mb-8">
            <CSVUpload 
              cookies={cookies}
              updateCookies={updateCookies}
              updateCookieDay={updateCookieDay}
              user={user}
            />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamt Verkauft</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStats.totalSold}</p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lagerbestand</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStats.totalStock}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Umsatz</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">€{totalStats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Niedrige Bestände</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{lowStockCount}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Cookie-Sorte suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cookie Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCookies.map((cookie) => {
            const stockStatus = getStockStatus(cookie.stock);
            const totalInventory = cookie.stock + cookie.prepared;
            const todayData = getTodayData(cookie);
            
            return (
              <div
                key={cookie.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{cookie.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm text-gray-500">{cookie.category}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">€{cookie.price}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {stockStatus.label}
                    </div>
                  </div>

                  {/* Today's Performance */}
                  <div className="mb-3 sm:mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Heute</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm sm:text-lg font-bold text-green-600">{todayData.sold}</div>
                        <div className="text-xs text-gray-500">Verkauft</div>
                      </div>
                      <div>
                        <div className="text-sm sm:text-lg font-bold text-blue-600">{todayData.new}</div>
                        <div className="text-xs text-gray-500">Produziert</div>
                      </div>
                      <div>
                        <div className="text-sm sm:text-lg font-bold text-red-600">{todayData.trash}</div>
                        <div className="text-xs text-gray-500">Entsorgt</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Verkauft (Gesamt)</span>
                      <span className="font-semibold text-emerald-600">{cookie.sold}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Auf Lager</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateStock(cookie.id, 'stock', -1)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        </button>
                        <span className="font-semibold text-blue-600 min-w-[2rem] text-center text-sm sm:text-base">{cookie.stock}</span>
                        <button
                          onClick={() => updateStock(cookie.id, 'stock', 1)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Vorbereitet</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateStock(cookie.id, 'prepared', -1)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        </button>
                        <span className="font-semibold text-purple-600 min-w-[2rem] text-center text-sm sm:text-base">{cookie.prepared}</span>
                        <button
                          onClick={() => updateStock(cookie.id, 'prepared', 1)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Inventar Gesamt</span>
                      <span className="font-bold text-amber-600">{totalInventory}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Umsatz</span>
                      <span className="font-bold text-green-600">€{(cookie.sold * cookie.price).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Lagerstand</span>
                      <span>{Math.round((cookie.stock / (cookie.stock + cookie.sold)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (cookie.stock / (cookie.stock + cookie.sold)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-2 sm:mb-3">
                    <button
                      onClick={() => navigate(`/cookie/${cookie.id}`)}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => navigate(`/produktion/${cookie.id}`)}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 text-white px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm"
                      style={{ backgroundColor: websiteSettings.buttonBgColor }}
                    >
                      <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Produktion</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/daily/${cookie.id}`)}
                    className="w-full flex items-center justify-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Tageserfassung</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCookies.length === 0 && (
          <div className="text-center py-12">
            <Cookie className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Cookies gefunden</h3>
            <p className="text-gray-500">Versuchen Sie einen anderen Suchbegriff oder Filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;