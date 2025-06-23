import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Save, Upload, X, Eye, RotateCcw } from 'lucide-react';
import { User } from '../data/users';

interface WebsiteSettings {
  companyName: string;
  logo: string | null;
  backgroundColor: string;
  textColor: string;
  buttonBgColor: string;
}

interface WebsiteSettingsProps {
  websiteSettings: WebsiteSettings;
  updateWebsiteSettings: (settings: Partial<WebsiteSettings>) => void;
  user: User;
}

function WebsiteSettings({ websiteSettings, updateWebsiteSettings, user }: WebsiteSettingsProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [companyName, setCompanyName] = useState(websiteSettings.companyName || "");
  const [logo, setLogo] = useState(websiteSettings.logo || null);
  const [backgroundColor, setBackgroundColor] = useState(websiteSettings.backgroundColor || "#fef3c7");
  const [textColor, setTextColor] = useState(websiteSettings.textColor || "#1f2937");
  const [buttonBgColor, setButtonBgColor] = useState(websiteSettings.buttonBgColor || "#f59e0b");
  const [saved, setSaved] = useState(false);

  // Logo Upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogo(result);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaved(false);
  };

  const handleSave = () => {
    updateWebsiteSettings({
      companyName,
      logo,
      backgroundColor,
      textColor,
      buttonBgColor,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Color presets
  const colorPresets = [
    {
      name: 'Amber Classic',
      backgroundColor: '#fef3c7',
      textColor: '#1f2937',
      buttonBgColor: '#f59e0b'
    },
    {
      name: 'Blue Professional',
      backgroundColor: '#dbeafe',
      textColor: '#1e3a8a',
      buttonBgColor: '#3b82f6'
    },
    {
      name: 'Green Fresh',
      backgroundColor: '#d1fae5',
      textColor: '#064e3b',
      buttonBgColor: '#10b981'
    },
    {
      name: 'Purple Creative',
      backgroundColor: '#e9d5ff',
      textColor: '#581c87',
      buttonBgColor: '#8b5cf6'
    },
    {
      name: 'Pink Sweet',
      backgroundColor: '#fce7f3',
      textColor: '#831843',
      buttonBgColor: '#ec4899'
    },
    {
      name: 'Orange Warm',
      backgroundColor: '#fed7aa',
      textColor: '#9a3412',
      buttonBgColor: '#ea580c'
    }
  ];

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setBackgroundColor(preset.backgroundColor);
    setTextColor(preset.textColor);
    setButtonBgColor(preset.buttonBgColor);
    setSaved(false);
  };

  const resetToDefaults = () => {
    setCompanyName("Cookie Business");
    setLogo(null);
    setBackgroundColor("#fef3c7");
    setTextColor("#1f2937");
    setButtonBgColor("#f59e0b");
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Website & Branding</h1>
                  <p className="text-sm sm:text-base text-gray-600">Anpassung von Design und Erscheinungsbild</p>
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
            <Save className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span className="text-green-800 font-medium text-sm sm:text-base">
              Website-Einstellungen erfolgreich gespeichert!
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Firmeninformationen</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmenname
                  </label>
                  <input
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setSaved(false); }}
                    placeholder="z.B. Mein Cookie Business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Upload
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Logo auswählen</span>
                      </button>
                      {logo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>Entfernen</span>
                        </button>
                      )}
                    </div>
                    {logo && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                        <img 
                          src={logo} 
                          alt="Logo Vorschau" 
                          className="h-12 w-12 object-contain rounded bg-white border shadow-sm" 
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Logo Vorschau</p>
                          <p className="text-xs text-gray-500">Wird im Header angezeigt</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Farbeinstellungen</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hintergrundfarbe
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={e => { setBackgroundColor(e.target.value); setSaved(false); }}
                      className="w-12 h-12 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={e => { setBackgroundColor(e.target.value); setSaved(false); }}
                      className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                      placeholder="#fef3c7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Textfarbe
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => { setTextColor(e.target.value); setSaved(false); }}
                      className="w-12 h-12 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={e => { setTextColor(e.target.value); setSaved(false); }}
                      className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button-Farbe
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={buttonBgColor}
                      onChange={e => { setButtonBgColor(e.target.value); setSaved(false); }}
                      className="w-12 h-12 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={buttonBgColor}
                      onChange={e => { setButtonBgColor(e.target.value); setSaved(false); }}
                      className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Farbvorlagen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors text-left"
                  >
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: preset.backgroundColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: preset.textColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: preset.buttonBgColor }}
                      />
                    </div>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold"
              >
                <Save className="h-5 w-5" />
                <span>Einstellungen speichern</span>
              </button>
              <button
                onClick={resetToDefaults}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Zurücksetzen</span>
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Live-Vorschau</h2>
              </div>
              
              <div 
                className="p-6 rounded-xl border-2 border-dashed border-gray-300 min-h-[400px]"
                style={{ 
                  backgroundColor: backgroundColor,
                  color: textColor 
                }}
              >
                {/* Header Preview */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    {logo && (
                      <img 
                        src={logo} 
                        alt="Logo" 
                        className="h-8 w-8 object-contain rounded bg-gray-50 border" 
                      />
                    )}
                    <span className="font-bold text-lg text-gray-900">
                      {companyName || "Ihr Firmenname"}
                    </span>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Dashboard Vorschau</h3>
                  <p className="text-sm opacity-80">
                    So wird Ihr Dashboard mit den gewählten Farben aussehen.
                  </p>

                  {/* Sample Cookie Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      className="p-4 rounded-lg shadow-sm border"
                      style={{ backgroundColor: buttonBgColor }}
                    >
                      <h4 className="font-semibold text-white">Chocolate Chip</h4>
                      <p className="text-white text-sm opacity-90">Beispiel Cookie-Karte</p>
                    </div>
                    <div 
                      className="p-4 rounded-lg shadow-sm border"
                      style={{ backgroundColor: buttonBgColor }}
                    >
                      <h4 className="font-semibold text-white">Oatmeal Raisin</h4>
                      <p className="text-white text-sm opacity-90">Beispiel Cookie-Karte</p>
                    </div>
                  </div>

                  {/* Sample Button */}
                  <button 
                    className="px-4 py-2 rounded-lg font-medium text-white shadow-sm"
                    style={{ backgroundColor: buttonBgColor }}
                  >
                    Beispiel Button
                  </button>
                </div>
              </div>
            </div>

            {/* Color Information */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Farbinformationen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hintergrund:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    <span className="font-mono">{backgroundColor}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Text:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: textColor }}
                    />
                    <span className="font-mono">{textColor}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Buttons:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: buttonBgColor }}
                    />
                    <span className="font-mono">{buttonBgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebsiteSettings;