import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, BarChart3, Plus, Minus, Save, AlertCircle, MapPin, Smartphone, Globe, Truck, Users } from 'lucide-react';

interface DailyData {
  sold?: number; // Keep for backward compatibility
  prepared?: number;
  used?: number;
  trash?: number;
  new?: number;
  // New multi-channel sales data
  verkauft_location?: number;
  verkauft_ubereats?: number;
  verkauft_wolt?: number;
  verkauft_lieferando?: number;
  verkauft_website?: number;
  mitarbeiter_verbrauch?: number;
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

interface DailyTrackingProps {
  cookies: CookieData[];
  updateDailyData: (cookieId: number, date: string, dailyData: DailyData) => void;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function DailyTracking({ cookies, updateDailyData }: DailyTrackingProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showSuccess, setShowSuccess] = useState(false);

  const cookie = id ? cookies.find(c => c.id === Number(id)) : null;
  const displayCookies = cookie ? [cookie] : cookies;

  const getTodayData = (cookieData: CookieData): DailyData => {
    return cookieData.history[selectedDate] || {
      verkauft_location: 0,
      verkauft_ubereats: 0,
      verkauft_wolt: 0,
      verkauft_lieferando: 0,
      verkauft_website: 0,
      mitarbeiter_verbrauch: 0,
      prepared: 0,
      used: 0,
      trash: 0,
      new: 0
    };
  };

  const updateField = (cookieId: number, field: keyof DailyData, delta: number) => {
    const targetCookie = cookies.find(c => c.id === cookieId);
    if (!targetCookie) return;

    const currentData = getTodayData(targetCookie);
    const newData = {
      ...currentData,
      [field]: Math.max(0, (currentData[field] || 0) + delta)
    };
    
    // Calculate total sales from all channels for backward compatibility
    const totalSales = (newData.verkauft_location || 0) + 
                      (newData.verkauft_ubereats || 0) + 
                      (newData.verkauft_wolt || 0) + 
                      (newData.verkauft_lieferando || 0) + 
                      (newData.verkauft_website || 0);
    
    // Update the sold field for backward compatibility and revenue calculation
    newData.sold = totalSales;
    
    // Update daily data which will trigger revenue calculation
    updateDailyData(cookieId, selectedDate, newData);
  };

  const saveAllData = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getDateStats = (cookieData: CookieData) => {
    const data = getTodayData(cookieData);
    const totalSales = (data.verkauft_location || 0) + 
                      (data.verkauft_ubereats || 0) + 
                      (data.verkauft_wolt || 0) + 
                      (data.verkauft_lieferando || 0) + 
                      (data.verkauft_website || 0);
    
    const efficiency = (data.prepared || 0) > 0 ? ((totalSales / (data.prepared || 1)) * 100) : 0;
    const wasteRate = (data.new || 0) > 0 ? (((data.trash || 0) / (data.new || 1)) * 100) : 0;
    const revenue = totalSales * cookieData.price;
    
    return { efficiency, wasteRate, revenue, totalSales };
  };

  // Calculate total daily revenue across all cookies for the selected date
  const getTotalDailyRevenue = () => {
    return displayCookies.reduce((total, cookieData) => {
      const stats = getDateStats(cookieData);
      return total + stats.revenue;
    }, 0);
  };

  // Calculate total daily sales across all cookies for the selected date
  const getTotalDailySales = () => {
    return displayCookies.reduce((total, cookieData) => {
      const stats = getDateStats(cookieData);
      return total + stats.totalSales;
    }, 0);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'ubereats': return <Smartphone className="h-4 w-4" />;
      case 'wolt': return <Truck className="h-4 w-4" />;
      case 'lieferando': return <Smartphone className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'mitarbeiter': return <Users className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'location': return 'bg-blue-50 border-blue-200';
      case 'ubereats': return 'bg-green-50 border-green-200';
      case 'wolt': return 'bg-cyan-50 border-cyan-200';
      case 'lieferando': return 'bg-orange-50 border-orange-200';
      case 'website': return 'bg-purple-50 border-purple-200';
      case 'mitarbeiter': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const salesChannels = [
    { key: 'verkauft_location', label: 'Vor Ort', icon: 'location' },
    { key: 'verkauft_ubereats', label: 'Uber Eats', icon: 'ubereats' },
    { key: 'verkauft_wolt', label: 'Wolt', icon: 'wolt' },
    { key: 'verkauft_lieferando', label: 'Lieferando', icon: 'lieferando' },
    { key: 'verkauft_website', label: 'Website', icon: 'website' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(cookie ? `/cookie/${id}` : '/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                    {cookie ? `${cookie.name} - Tageserfassung` : 'Multi-Channel Tageserfassung'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">Verkäufe nach Kanälen und Verbrauch</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
              />
              <button
                onClick={saveAllData}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Speichern</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-3">
            <Save className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span className="text-green-800 font-medium text-sm sm:text-base">
              Daten erfolgreich gespeichert!
            </span>
          </div>
        )}

        {/* Daily Revenue Summary */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-sm p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">Tagesumsatz für {selectedDate}</h2>
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold">€{getTotalDailyRevenue().toFixed(2)}</div>
                  <div className="text-green-100 text-sm">Gesamtumsatz</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{getTotalDailySales()}</div>
                  <div className="text-green-100 text-sm">Cookies verkauft</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Cookie Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {displayCookies.map((cookieData) => {
            const todayData = getTodayData(cookieData);
            const stats = getDateStats(cookieData);

            return (
              <div key={cookieData.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cookie Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">{cookieData.name}</h3>
                      <p className="text-amber-100 text-sm sm:text-base">{cookieData.category} • €{cookieData.price}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-bold">€{stats.revenue.toFixed(2)}</div>
                      <div className="text-xs sm:text-sm text-amber-100">Cookie-Umsatz</div>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="p-3 sm:p-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">{stats.totalSales}</div>
                      <div className="text-xs text-gray-500">Gesamt verkauft</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.efficiency.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">Effizienz</div>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-red-600">{stats.wasteRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">Verschwendung</div>
                    </div>
                  </div>
                </div>

                {/* Sales Channels */}
                <div className="p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Verkaufskanäle</h4>
                  <div className="space-y-3 sm:space-y-4">
                    {salesChannels.map(({ key, label, icon }) => (
                      <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${getChannelColor(icon)}`}>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {getChannelIcon(icon)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{label}</div>
                            <div className="text-xs text-gray-600">Verkaufte Cookies</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <button
                            onClick={() => updateField(cookieData.id, key as keyof DailyData, -1)}
                            className="p-1 sm:p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                          </button>
                          <span className="text-lg sm:text-xl font-bold text-gray-900 min-w-[2rem] sm:min-w-[3rem] text-center">
                            {todayData[key as keyof DailyData] || 0}
                          </span>
                          <button
                            onClick={() => updateField(cookieData.id, key as keyof DailyData, 1)}
                            className="p-1 sm:p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Employee Consumption */}
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${getChannelColor('mitarbeiter')}`}>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getChannelIcon('mitarbeiter')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">Mitarbeiter Verbrauch</div>
                          <div className="text-xs text-gray-600">Kostenlose Verkostung</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button
                          onClick={() => updateField(cookieData.id, 'mitarbeiter_verbrauch', -1)}
                          className="p-1 sm:p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                        </button>
                        <span className="text-lg sm:text-xl font-bold text-gray-900 min-w-[2rem] sm:min-w-[3rem] text-center">
                          {todayData.mitarbeiter_verbrauch || 0}
                        </span>
                        <button
                          onClick={() => updateField(cookieData.id, 'mitarbeiter_verbrauch', 1)}
                          className="p-1 sm:p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Production & Waste Tracking */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Produktion & Verschwendung</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Prepared */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Vorbereitet</div>
                          <div className="text-xs text-gray-600">Teig vorbereitet</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateField(cookieData.id, 'prepared', -1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="text-lg font-bold text-blue-600 min-w-[2rem] text-center">
                            {todayData.prepared || 0}
                          </span>
                          <button
                            onClick={() => updateField(cookieData.id, 'prepared', 1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* New Production */}
                      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Neu produziert</div>
                          <div className="text-xs text-gray-600">Heute hergestellt</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateField(cookieData.id, 'new', -1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="text-lg font-bold text-amber-600 min-w-[2rem] text-center">
                            {todayData.new || 0}
                          </span>
                          <button
                            onClick={() => updateField(cookieData.id, 'new', 1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Used */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Verbraucht</div>
                          <div className="text-xs text-gray-600">Für Produktion</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateField(cookieData.id, 'used', -1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="text-lg font-bold text-purple-600 min-w-[2rem] text-center">
                            {todayData.used || 0}
                          </span>
                          <button
                            onClick={() => updateField(cookieData.id, 'used', 1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Trash */}
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">Entsorgt</div>
                          <div className="text-xs text-gray-600">Verschwendete Cookies</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateField(cookieData.id, 'trash', -1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="text-lg font-bold text-red-600 min-w-[2rem] text-center">
                            {todayData.trash || 0}
                          </span>
                          <button
                            onClick={() => updateField(cookieData.id, 'trash', 1)}
                            className="p-1 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {stats.wasteRate > 10 && (
                    <div className="mt-4 flex items-center space-x-2 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                      <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                        Hohe Verschwendungsrate: {stats.wasteRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Info */}
        {!cookie && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Für detaillierte Einzelansicht auf einen Cookie klicken oder über das Dashboard navigieren.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Multi-Channel Tracking</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-blue-800">
                <div>
                  <strong>Vor Ort:</strong> Direktverkauf im Geschäft
                </div>
                <div>
                  <strong>Uber Eats:</strong> Lieferservice über Uber Eats
                </div>
                <div>
                  <strong>Wolt:</strong> Lieferservice über Wolt
                </div>
                <div>
                  <strong>Lieferando:</strong> Lieferservice über Lieferando
                </div>
                <div>
                  <strong>Website:</strong> Online-Bestellungen
                </div>
                <div>
                  <strong>Mitarbeiter:</strong> Kostenlose Verkostung/Verbrauch
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyTracking;