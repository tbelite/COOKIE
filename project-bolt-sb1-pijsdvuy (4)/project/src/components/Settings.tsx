import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Save, DollarSign, Cookie, CheckCircle, Plus, Trash2, TrendingUp, AlertTriangle, Palette, Upload, X, Download, Database, RotateCcw, ClipboardCheck, Users } from 'lucide-react';
import { User } from '../data/users';
import { exportAllData, clearAllData } from '../utils';

interface CookieData {
  id: number;
  name: string;
  sold: number;
  stock: number;
  prepared: number;
  price: number;
  productionPrice: number;
  category: string;
  history: Record<string, any>;
}

interface Settings {
  costPerCookie: number;
  costPerHour: number;
}

interface WebsiteSettings {
  companyName: string;
  logo: string | null;
  backgroundColor: string;
  textColor: string;
  buttonBgColor: string;
}

interface CookieSettings {
  name: string;
  productionPrice: number;
  salesPrice: number;
}

interface WarnLevels {
  [cookieName: string]: number;
}

interface SettingsProps {
  cookies: CookieData[];
  updateCookieSettings: (settings: CookieSettings[]) => void;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  user: User;
  addCookie: (name: string) => void;
  deleteCookie: (index: number) => void;
  websiteSettings: WebsiteSettings;
  updateWebsiteSettings: (settings: Partial<WebsiteSettings>) => void;
  warnLevels?: WarnLevels;
  updateWarnLevels?: (warnLevels: WarnLevels) => void;
}

function Settings({ 
  cookies, 
  updateCookieSettings, 
  settings, 
  updateSettings, 
  user, 
  addCookie, 
  deleteCookie,
  websiteSettings,
  updateWebsiteSettings,
  warnLevels = {},
  updateWarnLevels
}: SettingsProps) {
  const navigate = useNavigate();
  
  // State für Cookie-spezifische Einstellungen
  const [cookieInputs, setCookieInputs] = useState<CookieSettings[]>(
    cookies.map(c => ({
      name: c.name,
      productionPrice: c.productionPrice || 0.7,
      salesPrice: c.price || 2.5,
    }))
  );
  
  // State für globale Einstellungen
  const [costPerHour, setCostPerHour] = useState(settings.costPerHour);
  
  // State für Warnschwellen
  const [warnLevelInputs, setWarnLevelInputs] = useState<WarnLevels>(warnLevels);
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'cookies' | 'costs' | 'data' | 'inventory'>('cookies');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Cookie-Name ändern
  const handleNameChange = (i: number, value: string) => {
    setCookieInputs(prev =>
      prev.map((cookie, idx) => idx === i ? { ...cookie, name: value } : cookie)
    );
    setSaved(false);
  };

  // Produktionspreis ändern
  const handleProductionPriceChange = (i: number, value: number) => {
    setCookieInputs(prev =>
      prev.map((cookie, idx) => idx === i ? { ...cookie, productionPrice: value } : cookie)
    );
    setSaved(false);
  };

  // Verkaufspreis ändern
  const handleSalesPriceChange = (i: number, value: number) => {
    setCookieInputs(prev =>
      prev.map((cookie, idx) => idx === i ? { ...cookie, salesPrice: value } : cookie)
    );
    setSaved(false);
  };

  // Warnschwelle ändern
  const handleWarnLevelChange = (cookieName: string, value: number) => {
    setWarnLevelInputs(prev => ({
      ...prev,
      [cookieName]: value
    }));
    setSaved(false);
  };

  // Cookie hinzufügen
  const handleAddCookie = () => {
    const newName = `Neuer Cookie ${cookieInputs.length + 1}`;
    setCookieInputs(prev => [...prev, {
      name: newName,
      productionPrice: 0.7,
      salesPrice: 2.5
    }]);
    setWarnLevelInputs(prev => ({
      ...prev,
      [newName]: 10
    }));
    addCookie(newName);
    setSaved(false);
  };

  // Cookie löschen
  const handleDeleteCookie = (i: number) => {
    if (cookieInputs.length > 1) {
      const cookieToDelete = cookieInputs[i];
      setCookieInputs(prev => prev.filter((_, idx) => idx !== i));
      setWarnLevelInputs(prev => {
        const newWarnLevels = { ...prev };
        delete newWarnLevels[cookieToDelete.name];
        return newWarnLevels;
      });
      deleteCookie(i);
      setSaved(false);
    }
  };

  // Alle Einstellungen speichern
  const handleSave = () => {
    updateCookieSettings(cookieInputs);
    updateSettings({
      costPerHour: Number(costPerHour),
    });
    if (updateWarnLevels) {
      updateWarnLevels(warnLevelInputs);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Daten zurücksetzen
  const handleResetData = () => {
    if (showResetConfirm) {
      clearAllData();
      window.location.reload(); // Reload to reset to initial state
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  // Gewinnmargen berechnen
  const calculateProfitMargin = (salesPrice: number, productionPrice: number) => {
    const margin = salesPrice - productionPrice;
    const percentage = salesPrice > 0 ? (margin / salesPrice) * 100 : 0;
    return { margin, percentage };
  };

  // Check if user has admin access
  const isAdmin = user.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 text-center max-w-sm sm:max-w-md">
          <div className="p-2 sm:p-3 bg-red-100 rounded-full inline-block mb-4">
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Sie haben keine Berechtigung, auf die Einstellungen zuzugreifen. 
            Nur Administratoren können diese Seite verwenden.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                  <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Einstellungen</h1>
                  <p className="text-sm sm:text-base text-gray-600">System- und Geschäftseinstellungen verwalten</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Angemeldet als</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-amber-600 uppercase">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Success Message */}
        {saved && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span className="text-green-800 font-medium text-sm sm:text-base">
              Alle Einstellungen erfolgreich gespeichert!
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/website-settings')}
            className="flex items-center space-x-3 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Website & Branding</h3>
              <p className="text-sm text-gray-600">Design anpassen</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/rezepturen')}
            className="flex items-center space-x-3 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Cookie className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rezepturen</h3>
              <p className="text-sm text-gray-600">Zutaten verwalten</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center space-x-3 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Inventur</h3>
              <p className="text-sm text-gray-600">Warnschwellen</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className="flex items-center space-x-3 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <Database className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Daten</h3>
              <p className="text-sm text-gray-600">Backup & Reset</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/user-management')}
            className="flex items-center space-x-3 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Benutzer</h3>
              <p className="text-sm text-gray-600">Verwaltung</p>
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            <button
              onClick={() => setActiveTab('cookies')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-base font-medium transition-colors ${
                activeTab === 'cookies'
                  ? 'bg-amber-500 text-white rounded-tl-xl'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Cookie className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Cookie-Einstellungen</span>
              <span className="sm:hidden">Cookies</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-base font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-white rounded-tr-xl sm:rounded-tr-none'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <ClipboardCheck className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Inventur-Einstellungen</span>
              <span className="sm:hidden">Inventur</span>
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-base font-medium transition-colors ${
                activeTab === 'costs'
                  ? 'bg-amber-500 text-white rounded-bl-xl sm:rounded-bl-none'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <DollarSign className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Kostenparameter</span>
              <span className="sm:hidden">Kosten</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-base font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-amber-500 text-white rounded-br-xl'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Database className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Datenverwaltung</span>
              <span className="sm:hidden">Daten</span>
            </button>
          </div>
        </div>

        {/* Cookie Settings Tab */}
        {activeTab === 'cookies' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Cookie className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Cookie-spezifische Einstellungen</h2>
              </div>
              <button
                onClick={handleAddCookie}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Cookie hinzufügen</span>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {cookieInputs.map((cookie, i) => {
                const profit = calculateProfitMargin(cookie.salesPrice, cookie.productionPrice);
                const isLowMargin = profit.percentage < 30;
                const isNegativeMargin = profit.margin < 0;
                
                return (
                  <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 sm:p-6 border border-amber-200">
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                      {/* Cookie Name */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Cookie-Name
                        </label>
                        <input
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={cookie.name}
                          onChange={(e) => handleNameChange(i, e.target.value)}
                          placeholder={`Cookie ${i + 1} Name`}
                        />
                      </div>

                      {/* Production Price */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Produktionskosten (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={cookie.productionPrice}
                          onChange={(e) => handleProductionPriceChange(i, Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Material + Zutaten
                        </p>
                      </div>

                      {/* Sales Price */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Verkaufspreis (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={cookie.salesPrice}
                          onChange={(e) => handleSalesPriceChange(i, Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Endkundenpreis
                        </p>
                      </div>

                      {/* Profit Analysis */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Gewinnmarge
                        </label>
                        <div className={`p-2 sm:p-3 rounded-lg border-2 ${
                          isNegativeMargin ? 'bg-red-50 border-red-200' : 
                          isLowMargin ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {isNegativeMargin ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                            <div>
                              <div className={`text-sm sm:text-base font-bold ${
                                isNegativeMargin ? 'text-red-600' : 
                                isLowMargin ? 'text-yellow-600' : 
                                'text-green-600'
                              }`}>
                                €{profit.margin.toFixed(2)}
                              </div>
                              <div className={`text-xs ${
                                isNegativeMargin ? 'text-red-500' : 
                                isLowMargin ? 'text-yellow-500' : 
                                'text-green-500'
                              }`}>
                                {profit.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      {cookieInputs.length > 1 && (
                        <div className="flex items-end">
                          <button
                            onClick={() => handleDeleteCookie(i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5 sm:mt-7"
                            title="Cookie löschen"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {isNegativeMargin && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-xs sm:text-sm text-red-700 font-medium">
                          Warnung: Verkaufspreis liegt unter den Produktionskosten!
                        </span>
                      </div>
                    )}
                    {isLowMargin && !isNegativeMargin && (
                      <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                          Niedrige Gewinnmarge: Unter 30%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inventory Settings Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Inventur-Einstellungen</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Warnschwellen für niedrige Bestände</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Legen Sie fest, ab welcher Anzahl ein Cookie-Bestand als "niedrig" oder "kritisch" eingestuft wird.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cookieInputs.map((cookie, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {cookie.name}
                        </label>
                        <span className="text-xs text-gray-500">Stück</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={warnLevelInputs[cookie.name] || 10}
                        onChange={(e) => handleWarnLevelChange(cookie.name, Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center font-semibold"
                      />
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Warnung bei ≤ {warnLevelInputs[cookie.name] || 10} Stück
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Hinweise zu Warnschwellen</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Kritisch:</strong> Bestand ≤ 50% der Warnschwelle (rot)</p>
                  <p>• <strong>Niedrig:</strong> Bestand ≤ 100% der Warnschwelle (gelb)</p>
                  <p>• <strong>Gut:</strong> Bestand &gt; Warnschwelle (grün)</p>
                  <p>• Diese Werte werden bei der Inventur zur Bewertung verwendet</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Settings Tab */}
        {activeTab === 'costs' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Globale Kostenparameter</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Arbeitskosten pro Stunde (€)
                </label>
                <input
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  type="number"
                  step="0.1"
                  min="0"
                  value={costPerHour}
                  onChange={(e) => setCostPerHour(Number(e.target.value))}
                />
                <p className="text-sm text-gray-500">
                  Lohnkosten pro Mitarbeiterstunde inkl. Nebenkosten
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Kostenübersicht</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arbeitskosten pro Minute:</span>
                    <span className="font-medium">€{(costPerHour / 60).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bei 10 Cookies/Stunde:</span>
                    <span className="font-medium text-amber-600">
                      €{(costPerHour / 10).toFixed(2)} Arbeitskosten pro Cookie
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Database className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Datenverwaltung</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Datenexport & Backup</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => exportAllData()}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>Vollständiges Backup erstellen</span>
                  </button>
                  <p className="text-sm text-gray-600">
                    Exportiert alle Daten (Cookies, Einstellungen, Historie, Inventuren, Rezepturen) als JSON-Datei für Backup-Zwecke.
                  </p>
                </div>
              </div>

              {/* Reset Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Daten zurücksetzen</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleResetData}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      showResetConfirm 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>
                      {showResetConfirm ? 'Bestätigen: Alle Daten löschen' : 'Alle Daten zurücksetzen'}
                    </span>
                  </button>
                  <p className="text-sm text-gray-600">
                    {showResetConfirm 
                      ? '⚠️ WARNUNG: Dies löscht ALLE Daten unwiderruflich! Klicken Sie erneut zum Bestätigen.'
                      : 'Setzt alle Daten auf die Standardwerte zurück. Diese Aktion kann nicht rückgängig gemacht werden.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Data Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Datenspeicherung</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Alle Daten werden lokal in Ihrem Browser gespeichert (localStorage)</p>
                <p>• Daten bleiben auch nach dem Schließen des Browsers erhalten</p>
                <p>• Bei Browserwechsel oder anderem Gerät sind Daten nicht verfügbar</p>
                <p>• Regelmäßige Backups werden empfohlen</p>
                <p>• Inventurprotokolle und Rezepturen werden ebenfalls lokal gespeichert</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="text-center">
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-lg font-semibold"
          >
            <Save className="h-4 w-4 sm:h-6 sm:w-6" />
            <span>Alle Einstellungen speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;