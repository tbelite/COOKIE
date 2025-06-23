import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Calendar, User, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Filter, Search, BarChart3 } from 'lucide-react';
import { exportAuditToCSV } from '../utils';

interface InventoryAuditItem {
  cookie: string;
  soll: number;
  ist_lager_verpackt?: number;
  ist_lager_versand?: number;
  ist_location?: number;
  ist_final?: number;
  ist?: number; // For backward compatibility
  differenz: number;
  kommentar: string;
}

interface InventoryAudit {
  id: string;
  date: string;
  user: string;
  userName: string;
  items: InventoryAuditItem[];
  totalDifference: number;
  status: 'completed' | 'pending';
  createdAt: string;
}

interface CookieData {
  id: number;
  name: string;
  sold: number;
  stock: number;
  prepared: number;
  price: number;
  category: string;
  history: Record<string, any>;
}

interface InventurLogProps {
  inventoryAudits: InventoryAudit[];
  cookies: CookieData[];
}

function InventurLog({ inventoryAudits, cookies }: InventurLogProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | '90days'>('all');

  // Filter audits based on search and period
  const filteredAudits = inventoryAudits.filter(audit => {
    const matchesSearch = audit.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.date.includes(searchTerm) ||
                         audit.items.some(item => item.cookie.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterPeriod === 'all') return matchesSearch;
    
    const auditDate = new Date(audit.date);
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - auditDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (filterPeriod) {
      case '7days': return matchesSearch && daysAgo <= 7;
      case '30days': return matchesSearch && daysAgo <= 30;
      case '90days': return matchesSearch && daysAgo <= 90;
      default: return matchesSearch;
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate summary statistics
  const totalAudits = filteredAudits.length;
  const totalDifferences = filteredAudits.reduce((sum, audit) => sum + audit.totalDifference, 0);
  const avgDifference = totalAudits > 0 ? totalDifferences / totalAudits : 0;
  const recentAudits = filteredAudits.filter(audit => {
    const auditDate = new Date(audit.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return auditDate >= sevenDaysAgo;
  }).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return 'text-green-600';
    if (Math.abs(difference) <= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  const getDifferenceIcon = (difference: number) => {
    if (difference === 0) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  // Check if audit has new format with multiple storage locations
  const hasMultipleLocations = (item: InventoryAuditItem) => {
    return item.ist_lager_verpackt !== undefined || 
           item.ist_lager_versand !== undefined || 
           item.ist_location !== undefined;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/inventur')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Inventurprotokoll</h1>
                  <p className="text-sm sm:text-base text-gray-600">Historie aller Bestandsaufnahmen</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportAuditToCSV(filteredAudits)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => navigate('/inventur')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Neue Inventur</span>
                <span className="sm:hidden">Inventur</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Inventuren Gesamt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalAudits}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Letzte 7 Tage</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{recentAudits}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamtabweichungen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalDifferences}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ø Abweichung</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{avgDifference.toFixed(1)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
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
                  placeholder="Suche nach Benutzer, Datum oder Cookie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">Alle Zeiträume</option>
                <option value="7days">Letzte 7 Tage</option>
                <option value="30days">Letzte 30 Tage</option>
                <option value="90days">Letzte 90 Tage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit List */}
        {filteredAudits.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Inventuren gefunden</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterPeriod !== 'all' 
                ? 'Versuchen Sie einen anderen Suchbegriff oder Zeitraum.'
                : 'Führen Sie Ihre erste Inventur durch, um Protokolle zu sehen.'
              }
            </p>
            <button
              onClick={() => navigate('/inventur')}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Erste Inventur durchführen
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredAudits.map((audit) => (
              <div key={audit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Audit Header */}
                <div 
                  className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 cursor-pointer hover:from-amber-100 hover:to-orange-100 transition-colors"
                  onClick={() => setSelectedAudit(selectedAudit === audit.id ? null : audit.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Inventur vom {formatDate(audit.date)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{audit.userName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{audit.items.length} Artikel</span>
                          </div>
                          <span>Erstellt: {formatDateTime(audit.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">
                          {audit.totalDifference}
                        </div>
                        <div className="text-sm text-gray-600">Gesamtabweichung</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        audit.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {audit.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Details */}
                {selectedAudit === audit.id && (
                  <div className="p-4 sm:p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-semibold text-gray-700">Cookie</th>
                            <th className="text-center py-3 px-2 font-semibold text-gray-700">Soll</th>
                            {hasMultipleLocations(audit.items[0]) ? (
                              <>
                                <th className="text-center py-3 px-2 font-semibold text-gray-700">Lager Verpackt</th>
                                <th className="text-center py-3 px-2 font-semibold text-gray-700">Lager Versand</th>
                                <th className="text-center py-3 px-2 font-semibold text-gray-700">Location</th>
                                <th className="text-center py-3 px-2 font-semibold text-gray-700">IST Gesamt</th>
                              </>
                            ) : (
                              <th className="text-center py-3 px-2 font-semibold text-gray-700">Ist</th>
                            )}
                            <th className="text-center py-3 px-2 font-semibold text-gray-700">Differenz</th>
                            <th className="text-left py-3 px-2 font-semibold text-gray-700">Kommentar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audit.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900">{item.cookie}</div>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.soll}
                                </span>
                              </td>
                              {hasMultipleLocations(item) ? (
                                <>
                                  <td className="text-center py-3 px-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {item.ist_lager_verpackt || 0}
                                    </span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      {item.ist_lager_versand || 0}
                                    </span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                      {item.ist_location || 0}
                                    </span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {item.ist_final || 0}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <td className="text-center py-3 px-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {item.ist || 0}
                                  </span>
                                </td>
                              )}
                              <td className="text-center py-3 px-2">
                                <div className="flex items-center justify-center space-x-1">
                                  {getDifferenceIcon(item.differenz)}
                                  <span className={`font-bold text-sm ${getDifferenceColor(item.differenz)}`}>
                                    {item.differenz > 0 ? `+${item.differenz}` : item.differenz}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="text-sm text-gray-600">
                                  {item.kommentar || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InventurLog;