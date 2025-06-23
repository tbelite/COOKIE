import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, DollarSign, Plus, Minus, Calculator, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';

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

interface CookieDetailProps {
  cookies: CookieData[];
  updateCookies: (cookies: CookieData[]) => void;
  updateCookieDay?: (cookieId: number, values: Partial<DailyData>, date?: string) => void;
}

function CookieDetail({ cookies, updateCookies, updateCookieDay }: CookieDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const cookie = cookies.find(c => c.id === Number(id));

  if (!cookie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie nicht gefunden</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  const updateStock = (type: 'stock' | 'prepared', delta: number) => {
    const updatedCookies = cookies.map(c => 
      c.id === cookie.id 
        ? { ...c, [type]: Math.max(0, c[type] + delta) }
        : c
    );
    updateCookies(updatedCookies);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Kritisch', icon: AlertTriangle };
    if (stock < 20) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Niedrig', icon: AlertTriangle };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Gut', icon: Package };
  };

  const getHistoricalStats = () => {
    const dates = Object.keys(cookie.history).sort().slice(-7); // Last 7 days
    const totalSold = dates.reduce((sum, date) => sum + cookie.history[date].sold, 0);
    const totalProduced = dates.reduce((sum, date) => sum + cookie.history[date].new, 0);
    const totalWaste = dates.reduce((sum, date) => sum + cookie.history[date].trash, 0);
    const avgDaily = totalSold / dates.length;
    const wasteRate = totalProduced > 0 ? (totalWaste / totalProduced) * 100 : 0;
    
    return { totalSold, totalProduced, totalWaste, avgDaily, wasteRate, days: dates.length };
  };

  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    return cookie.history[today] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0 };
  };

  const stockStatus = getStockStatus(cookie.stock);
  const totalInventory = cookie.stock + cookie.prepared;
  const totalRevenue = cookie.sold * cookie.price;
  const historicalStats = getHistoricalStats();
  const todayData = getTodayData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{cookie.name}</h1>
                <p className="text-gray-600">{cookie.category} • €{cookie.price}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
              {stockStatus.label}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{cookie.sold}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Verkauft (Gesamt)</h3>
            <p className="text-gray-600">Alle verkauften Cookies</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{totalInventory}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Inventar</h3>
            <p className="text-gray-600">Lager + Vorbereitet</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Umsatz</h3>
            <p className="text-gray-600">Gesamtumsatz</p>
          </div>
        </div>

        {/* Today's Performance */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Heute's Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayData.sold}</div>
              <div className="text-sm text-gray-600">Verkauft</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{todayData.prepared}</div>
              <div className="text-sm text-gray-600">Vorbereitet</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{todayData.new}</div>
              <div className="text-sm text-gray-600">Produziert</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{todayData.used}</div>
              <div className="text-sm text-gray-600">Verbraucht</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{todayData.trash}</div>
              <div className="text-sm text-gray-600">Entsorgt</div>
            </div>
          </div>
        </div>

        {/* Historical Analytics */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">7-Tage Analyse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{historicalStats.totalSold}</div>
              <div className="text-sm text-gray-600">Gesamt verkauft</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{historicalStats.avgDaily.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Ø täglich verkauft</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{historicalStats.totalProduced}</div>
              <div className="text-sm text-gray-600">Gesamt produziert</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{historicalStats.wasteRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Verschwendungsrate</div>
            </div>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lagerbestand verwalten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Auf Lager</h3>
                  <p className="text-sm text-gray-600">Fertige Cookies im Lager</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateStock('stock', -1)}
                    className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Minus className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-blue-600 min-w-[3rem] text-center">
                    {cookie.stock}
                  </span>
                  <button
                    onClick={() => updateStock('stock', 1)}
                    className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Vorbereitet</h3>
                  <p className="text-sm text-gray-600">Teig vorbereitet, noch nicht gebacken</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateStock('prepared', -1)}
                    className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Minus className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-purple-600 min-w-[3rem] text-center">
                    {cookie.prepared}
                  </span>
                  <button
                    onClick={() => updateStock('prepared', 1)}
                    className="p-2 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gesamt Inventar</h3>
                <p className="text-4xl font-bold text-amber-600 mb-4">{totalInventory}</p>
                <p className="text-sm text-gray-600">Cookies verfügbar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Produktionsplanung</h2>
              <p className="text-gray-600 mb-6">
                Berechnen Sie Produktionskosten und planen Sie neue Cookie-Chargen
              </p>
              <button
                onClick={() => navigate(`/produktion/${cookie.id}`)}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Calculator className="h-6 w-6" />
                <span className="text-lg font-semibold">Zur Produktion</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tageserfassung</h2>
              <p className="text-gray-600 mb-6">
                Erfassen Sie tägliche Verkäufe, Produktion und Verschwendung
              </p>
              <button
                onClick={() => navigate(`/daily/${cookie.id}`)}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-lg font-semibold">Zur Tageserfassung</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieDetail;