import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, BarChart3, AlertTriangle, MapPin, Smartphone, Globe, Truck, Users } from 'lucide-react';

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

interface TagesInfoProps {
  cookies: CookieData[];
}

function TagesInfo({ cookies }: TagesInfoProps) {
  const navigate = useNavigate();

  // Alle genutzten Tage ermitteln
  const allDays = Array.from(
    new Set(
      cookies.flatMap(cookie => Object.keys(cookie.history))
    )
  ).sort((a, b) => b.localeCompare(a)); // Neueste zuerst

  const getDayTotals = (day: string) => {
    return cookies.reduce((totals, cookie) => {
      const data = cookie.history[day] || { 
        sold: 0, prepared: 0, used: 0, trash: 0, new: 0,
        verkauft_location: 0, verkauft_ubereats: 0, verkauft_wolt: 0, 
        verkauft_lieferando: 0, verkauft_website: 0, mitarbeiter_verbrauch: 0
      };
      
      // Calculate total sales from all channels
      const totalChannelSales = (data.verkauft_location || 0) + 
                               (data.verkauft_ubereats || 0) + 
                               (data.verkauft_wolt || 0) + 
                               (data.verkauft_lieferando || 0) + 
                               (data.verkauft_website || 0);
      
      // Use channel sales if available, otherwise fall back to legacy sold field
      const actualSold = totalChannelSales > 0 ? totalChannelSales : (data.sold || 0);
      
      return {
        sold: totals.sold + actualSold,
        prepared: totals.prepared + (data.prepared || 0),
        used: totals.used + (data.used || 0),
        trash: totals.trash + (data.trash || 0),
        new: totals.new + (data.new || 0),
        revenue: totals.revenue + (actualSold * cookie.price),
        mitarbeiter_verbrauch: totals.mitarbeiter_verbrauch + (data.mitarbeiter_verbrauch || 0),
        // Channel breakdown
        verkauft_location: totals.verkauft_location + (data.verkauft_location || 0),
        verkauft_ubereats: totals.verkauft_ubereats + (data.verkauft_ubereats || 0),
        verkauft_wolt: totals.verkauft_wolt + (data.verkauft_wolt || 0),
        verkauft_lieferando: totals.verkauft_lieferando + (data.verkauft_lieferando || 0),
        verkauft_website: totals.verkauft_website + (data.verkauft_website || 0)
      };
    }, { 
      sold: 0, prepared: 0, used: 0, trash: 0, new: 0, revenue: 0, mitarbeiter_verbrauch: 0,
      verkauft_location: 0, verkauft_ubereats: 0, verkauft_wolt: 0, verkauft_lieferando: 0, verkauft_website: 0
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === today) return `${dateString} (Heute)`;
    if (dateString === yesterdayString) return `${dateString} (Gestern)`;
    return dateString;
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
      case 'location': return 'text-blue-600 bg-blue-100';
      case 'ubereats': return 'text-green-600 bg-green-100';
      case 'wolt': return 'text-cyan-600 bg-cyan-100';
      case 'lieferando': return 'text-orange-600 bg-orange-100';
      case 'website': return 'text-purple-600 bg-purple-100';
      case 'mitarbeiter': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
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
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Tagesübersicht</h1>
                  <p className="text-sm sm:text-base text-gray-600">Multi-Channel Verkauf & Produktion Historie</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/daily')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Tageserfassung</span>
                <span className="sm:hidden">Erfassung</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {allDays.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine Daten erfasst</h3>
            <p className="text-gray-500 mb-6">Beginnen Sie mit der Tageserfassung, um Ihre Daten zu verfolgen.</p>
            <button
              onClick={() => navigate('/daily')}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Zur Tageserfassung
            </button>
          </div>
        )}

        {allDays.map(day => {
          const dayTotals = getDayTotals(day);
          const wasteRate = dayTotals.new > 0 ? (dayTotals.trash / dayTotals.new) * 100 : 0;
          const efficiency = dayTotals.prepared > 0 ? (dayTotals.sold / dayTotals.prepared) * 100 : 0;

          const salesChannels = [
            { key: 'verkauft_location', label: 'Vor Ort', icon: 'location', value: dayTotals.verkauft_location },
            { key: 'verkauft_ubereats', label: 'Uber Eats', icon: 'ubereats', value: dayTotals.verkauft_ubereats },
            { key: 'verkauft_wolt', label: 'Wolt', icon: 'wolt', value: dayTotals.verkauft_wolt },
            { key: 'verkauft_lieferando', label: 'Lieferando', icon: 'lieferando', value: dayTotals.verkauft_lieferando },
            { key: 'verkauft_website', label: 'Website', icon: 'website', value: dayTotals.verkauft_website }
          ];

          return (
            <div key={day} className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Day Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{formatDate(day)}</h2>
                    <p className="text-amber-100 text-sm sm:text-base">Multi-Channel Tagesübersicht</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold">€{dayTotals.revenue.toFixed(2)}</div>
                    <div className="text-xs sm:text-sm text-amber-100">Tagesumsatz</div>
                  </div>
                </div>
              </div>

              {/* Day Summary Stats */}
              <div className="p-4 sm:p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{dayTotals.sold}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Verkauft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{dayTotals.new}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Produziert</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{dayTotals.prepared}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Vorbereitet</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl sm:text-2xl font-bold ${efficiency > 80 ? 'text-green-600' : efficiency > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {efficiency.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Effizienz</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl sm:text-2xl font-bold ${wasteRate < 5 ? 'text-green-600' : wasteRate < 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {wasteRate.toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Verschwendung</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-600">{dayTotals.mitarbeiter_verbrauch}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Mitarbeiter</div>
                  </div>
                </div>

                {/* Sales Channel Breakdown */}
                {salesChannels.some(channel => channel.value > 0) && (
                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Verkaufskanäle</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                      {salesChannels.filter(channel => channel.value > 0).map(channel => (
                        <div key={channel.key} className={`flex items-center space-x-2 p-2 sm:p-3 rounded-lg ${getChannelColor(channel.icon)}`}>
                          {getChannelIcon(channel.icon)}
                          <div>
                            <div className="text-sm font-bold">{channel.value}</div>
                            <div className="text-xs">{channel.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wasteRate > 10 && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                      Hohe Verschwendungsrate an diesem Tag: {wasteRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Table */}
              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Cookie</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Vor Ort</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Uber Eats</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Wolt</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Lieferando</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Website</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Mitarbeiter</th>
                        <th className="text-center py-3 px-1 sm:px-2 font-semibold text-gray-700 text-xs sm:text-sm">Gesamt</th>
                        <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm">Umsatz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cookies.map((cookie) => {
                        const data = cookie.history[day] || { 
                          verkauft_location: 0, verkauft_ubereats: 0, verkauft_wolt: 0, 
                          verkauft_lieferando: 0, verkauft_website: 0, mitarbeiter_verbrauch: 0,
                          sold: 0, prepared: 0, used: 0, trash: 0, new: 0
                        };
                        
                        const totalChannelSales = (data.verkauft_location || 0) + 
                                                 (data.verkauft_ubereats || 0) + 
                                                 (data.verkauft_wolt || 0) + 
                                                 (data.verkauft_lieferando || 0) + 
                                                 (data.verkauft_website || 0);
                        
                        const actualSold = totalChannelSales > 0 ? totalChannelSales : (data.sold || 0);
                        const revenue = actualSold * cookie.price;
                        const cookieWasteRate = (data.new || 0) > 0 ? ((data.trash || 0) / (data.new || 1)) * 100 : 0;
                        
                        // Only show rows with data
                        if (actualSold === 0 && (data.mitarbeiter_verbrauch || 0) === 0) return null;
                        
                        return (
                          <tr key={cookie.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div>
                                <div className="font-medium text-gray-900 text-xs sm:text-sm">{cookie.name}</div>
                                <div className="text-xs text-gray-500">{cookie.category} • €{cookie.price}</div>
                              </div>
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.verkauft_location || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {data.verkauft_location}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.verkauft_ubereats || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {data.verkauft_ubereats}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.verkauft_wolt || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                  {data.verkauft_wolt}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.verkauft_lieferando || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {data.verkauft_lieferando}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.verkauft_website || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {data.verkauft_website}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              {(data.mitarbeiter_verbrauch || 0) > 0 && (
                                <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {data.mitarbeiter_verbrauch}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {actualSold}
                              </span>
                            </td>
                            <td className="text-right py-2 sm:py-3 px-2 sm:px-4">
                              <span className="font-semibold text-green-600 text-xs sm:text-sm">€{revenue.toFixed(2)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TagesInfo;