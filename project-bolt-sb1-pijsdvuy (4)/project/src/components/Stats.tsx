import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity, Download, FileText, Database, Zap } from 'lucide-react';
import { exportCookiesToCSV, exportSummaryToCSV, exportAllData } from '../utils';

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

interface StatsProps {
  cookies: CookieData[];
}

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

function Stats({ cookies }: StatsProps) {
  const navigate = useNavigate();

  // Alle Tage, sortiert, max 7
  const days = Array.from(
    new Set(cookies.flatMap((c) => Object.keys(c.history)))
  ).sort().slice(-7);

  // Verkäufe pro Tag über alle Cookies aufsummiert
  const dailyData = days.map(day => ({
    day: day.split('-').slice(1).join('/'), // Format: MM/DD
    verkauft: cookies.reduce((sum, c) => sum + (c.history[day]?.sold || 0), 0),
    trash: cookies.reduce((sum, c) => sum + (c.history[day]?.trash || 0), 0),
    neu: cookies.reduce((sum, c) => sum + (c.history[day]?.new || 0), 0),
    umsatz: cookies.reduce((sum, c) => sum + ((c.history[day]?.sold || 0) * c.price), 0)
  }));

  // Cookie-Performance (Gesamtverkäufe)
  const cookiePerformance = cookies.map(cookie => ({
    name: cookie.name.length > 12 ? cookie.name.substring(0, 12) + '...' : cookie.name,
    verkauft: cookie.sold,
    umsatz: cookie.sold * cookie.price,
    category: cookie.category
  })).sort((a, b) => b.verkauft - a.verkauft);

  // Kategorie-Verteilung
  const categoryData = cookies.reduce((acc, cookie) => {
    const existing = acc.find(item => item.category === cookie.category);
    if (existing) {
      existing.value += cookie.sold;
      existing.umsatz += cookie.sold * cookie.price;
    } else {
      acc.push({
        category: cookie.category,
        value: cookie.sold,
        umsatz: cookie.sold * cookie.price
      });
    }
    return acc;
  }, [] as Array<{ category: string; value: number; umsatz: number }>);

  // Gesamtstatistiken
  const totalStats = {
    totalSold: cookies.reduce((sum, c) => sum + c.sold, 0),
    totalRevenue: cookies.reduce((sum, c) => sum + (c.sold * c.price), 0),
    totalStock: cookies.reduce((sum, c) => sum + c.stock, 0),
    totalWaste: days.reduce((sum, day) => 
      sum + cookies.reduce((daySum, c) => daySum + (c.history[day]?.trash || 0), 0), 0
    )
  };

  // Trend-Berechnung (letzte 3 vs. vorherige 4 Tage)
  const recentDays = days.slice(-3);
  const olderDays = days.slice(0, -3);
  const recentAvg = recentDays.length > 0 ? 
    recentDays.reduce((sum, day) => sum + cookies.reduce((daySum, c) => daySum + (c.history[day]?.sold || 0), 0), 0) / recentDays.length : 0;
  const olderAvg = olderDays.length > 0 ? 
    olderDays.reduce((sum, day) => sum + cookies.reduce((daySum, c) => daySum + (c.history[day]?.sold || 0), 0), 0) / olderDays.length : 0;
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Statistiken & Analysen</h1>
                  <p className="text-sm sm:text-base text-gray-600">Letzte 7 Tage Performance-Übersicht</p>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/advanced-stats')}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Erweiterte Stats</span>
                <span className="sm:hidden">Erweitert</span>
              </button>
              <button
                onClick={() => exportSummaryToCSV(cookies)}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Zusammenfassung</span>
                <span className="sm:hidden">Summary</span>
              </button>
              <button
                onClick={() => exportCookiesToCSV(cookies)}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Detailbericht</span>
                <span className="sm:hidden">Details</span>
              </button>
              <button
                onClick={() => exportAllData()}
                className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm"
              >
                <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Backup</span>
                <span className="sm:hidden">Backup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Advanced Stats Link */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/advanced-stats')}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-sm hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 group"
          >
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm sm:text-base">
                Erweiterte Statistiken mit Recharts
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">
                Detaillierte Charts, Plattform-Analysen und Zutatenverbrauch
              </div>
            </div>
            <div className="flex items-center space-x-2 text-purple-100">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium group-hover:text-white">
                Jetzt ansehen
              </span>
            </div>
          </button>
        </div>

        {/* Export Info Banner */}
        <div className="mb-6 sm:mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">📊 Datenexport verfügbar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-blue-800">
            <div>
              <strong>Zusammenfassung:</strong> Überblick aller Cookies mit Gewinnmargen
            </div>
            <div>
              <strong>Detailbericht:</strong> Tägliche Daten aller Cookies als CSV
            </div>
            <div>
              <strong>Backup:</strong> Vollständige Datensicherung als JSON
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamt Verkauft</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStats.totalSold}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend).toFixed(1)}% vs. letzte Woche
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamtumsatz</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">€{totalStats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs sm:text-sm text-gray-500">
                Ø €{(totalStats.totalRevenue / Math.max(1, totalStats.totalSold)).toFixed(2)} pro Cookie
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lagerbestand</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStats.totalStock}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs sm:text-sm text-gray-500">
                {cookies.filter(c => c.stock < 20).length} niedrige Bestände
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Verschwendung</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStats.totalWaste}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs sm:text-sm text-gray-500">
                Letzte 7 Tage
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Daily Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tägliche Verkäufe & Produktion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'verkauft' ? 'Verkauft' : name === 'neu' ? 'Produziert' : 'Entsorgt']}
                  labelFormatter={(label) => `Tag: ${label}`}
                />
                <Bar dataKey="verkauft" fill="#10b981" name="Verkauft" />
                <Bar dataKey="neu" fill="#f59e0b" name="Produziert" />
                <Bar dataKey="trash" fill="#ef4444" name="Entsorgt" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Umsatzentwicklung</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Umsatz']}
                  labelFormatter={(label) => `Tag: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="umsatz" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Cookie Performance */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Cookie Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cookiePerformance} layout="horizontal">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'verkauft' ? 'Verkauft' : 'Umsatz']}
                />
                <Bar dataKey="verkauft" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Kategorie-Verteilung</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Verkauft']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Erkenntnisse & Empfehlungen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Top Performer</h4>
              <p className="text-xs sm:text-sm text-green-700">
                {cookiePerformance[0]?.name} führt mit {cookiePerformance[0]?.verkauft} verkauften Cookies
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Trend</h4>
              <p className="text-xs sm:text-sm text-blue-700">
                {trend > 0 ? 'Positive' : 'Negative'} Entwicklung: {Math.abs(trend).toFixed(1)}% vs. letzte Woche
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2 text-sm sm:text-base">Verschwendung</h4>
              <p className="text-xs sm:text-sm text-amber-700">
                {totalStats.totalWaste} Cookies entsorgt in den letzten 7 Tagen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;