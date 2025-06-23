import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Download, X, Save, Eye } from 'lucide-react';
import { User } from '../data/users';

interface DailyData {
  sold?: number;
  prepared?: number;
  used?: number;
  trash?: number;
  new?: number;
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

interface CSVUploadProps {
  cookies: CookieData[];
  updateCookies: (cookies: CookieData[]) => void;
  updateCookieDay: (cookieId: number, values: Partial<DailyData>, date?: string) => void;
  user: User;
}

interface ParsedCSVRow {
  [key: string]: string;
}

interface MappedData {
  date: string;
  cookieName: string;
  platform: string;
  amount: number;
  originalRow: ParsedCSVRow;
}

// Enhanced CSV parser with better error handling
function parseCSV(text: string): ParsedCSVRow[] {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV muss mindestens Header und eine Datenzeile enthalten');
    
    const [header, ...rows] = lines;
    const columns = header.split(',').map(s => s.trim().replace(/"/g, ''));
    
    return rows.map((row, index) => {
      const values = row.split(',').map(s => s.trim().replace(/"/g, ''));
      const entry: ParsedCSVRow = {};
      
      columns.forEach((col, i) => {
        entry[col] = values[i] || '';
      });
      
      entry._rowIndex = (index + 2).toString(); // +2 because we skip header and arrays are 0-indexed
      return entry;
    });
  } catch (error) {
    throw new Error(`CSV-Parsing Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

// Platform mapping for sales channels
const platformMapping: Record<string, keyof DailyData> = {
  'location': 'verkauft_location',
  'vor ort': 'verkauft_location',
  'laden': 'verkauft_location',
  'shop': 'verkauft_location',
  'ubereats': 'verkauft_ubereats',
  'uber eats': 'verkauft_ubereats',
  'uber': 'verkauft_ubereats',
  'wolt': 'verkauft_wolt',
  'lieferando': 'verkauft_lieferando',
  'website': 'verkauft_website',
  'online': 'verkauft_website',
  'web': 'verkauft_website',
  'mitarbeiter': 'mitarbeiter_verbrauch',
  'staff': 'mitarbeiter_verbrauch',
  'employee': 'mitarbeiter_verbrauch'
};

function CSVUpload({ cookies, updateCookies, updateCookieDay, user }: CSVUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<ParsedCSVRow[]>([]);
  const [mappedData, setMappedData] = useState<MappedData[]>([]);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    cookie: '',
    platform: '',
    amount: ''
  });
  const [processing, setProcessing] = useState(false);

  const resetState = () => {
    setCsvData([]);
    setMappedData([]);
    setError('');
    setSuccess('');
    setShowPreview(false);
    setColumnMapping({ date: '', cookie: '', platform: '', amount: '' });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFilename(file.name);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Bitte eine CSV-Datei auswählen.');
      return;
    }

    try {
      const text = await file.text();
      const data = parseCSV(text);
      setCsvData(data);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Lesen der Datei.');
    }
  };

  const handleColumnMapping = () => {
    if (!columnMapping.date || !columnMapping.cookie || !columnMapping.platform || !columnMapping.amount) {
      setError('Bitte alle Spalten zuordnen.');
      return;
    }

    try {
      const mapped: MappedData[] = [];
      
      csvData.forEach(row => {
        const dateStr = row[columnMapping.date];
        const cookieName = row[columnMapping.cookie];
        const platform = row[columnMapping.platform];
        const amountStr = row[columnMapping.amount];

        // Validate data
        if (!dateStr || !cookieName || !platform || !amountStr) {
          return; // Skip incomplete rows
        }

        // Parse date
        let date: string;
        try {
          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Ungültiges Datum: ${dateStr}`);
          }
          date = parsedDate.toISOString().split('T')[0];
        } catch {
          return; // Skip rows with invalid dates
        }

        // Parse amount
        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount < 0) {
          return; // Skip rows with invalid amounts
        }

        mapped.push({
          date,
          cookieName: cookieName.trim(),
          platform: platform.toLowerCase().trim(),
          amount,
          originalRow: row
        });
      });

      setMappedData(mapped);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten der Daten.');
    }
  };

  const applyDataToSystem = () => {
    setProcessing(true);
    let updatedCount = 0;
    let skippedCount = 0;

    try {
      // Group data by date and cookie
      const groupedData: Record<string, Record<string, Record<string, number>>> = {};
      
      mappedData.forEach(item => {
        if (!groupedData[item.date]) groupedData[item.date] = {};
        if (!groupedData[item.date][item.cookieName]) groupedData[item.date][item.cookieName] = {};
        
        const platformKey = platformMapping[item.platform] || 'verkauft_location';
        groupedData[item.date][item.cookieName][platformKey] = 
          (groupedData[item.date][item.cookieName][platformKey] || 0) + item.amount;
      });

      // Apply to system
      Object.entries(groupedData).forEach(([date, cookieData]) => {
        Object.entries(cookieData).forEach(([cookieName, platformData]) => {
          const cookie = cookies.find(c => 
            c.name.toLowerCase() === cookieName.toLowerCase()
          );
          
          if (cookie) {
            const currentDayData = cookie.history[date] || {};
            const updatedDayData = { ...currentDayData };
            
            Object.entries(platformData).forEach(([platform, amount]) => {
              updatedDayData[platform as keyof DailyData] = amount;
            });

            // Calculate total sales for backward compatibility
            const totalSales = (updatedDayData.verkauft_location || 0) + 
                              (updatedDayData.verkauft_ubereats || 0) + 
                              (updatedDayData.verkauft_wolt || 0) + 
                              (updatedDayData.verkauft_lieferando || 0) + 
                              (updatedDayData.verkauft_website || 0);
            
            updatedDayData.sold = totalSales;
            
            updateCookieDay(cookie.id, updatedDayData, date);
            updatedCount++;
          } else {
            skippedCount++;
          }
        });
      });

      setSuccess(`✅ Import erfolgreich! ${updatedCount} Einträge aktualisiert${skippedCount > 0 ? `, ${skippedCount} übersprungen (Cookie nicht gefunden)` : ''}.`);
      setError('');
      
      // Reset form after success
      setTimeout(() => {
        resetState();
        setFilename('');
        if (fileRef.current) fileRef.current.value = '';
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Anwenden der Daten.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Datum,Cookie,Plattform,Anzahl
2025-01-16,Chocolate Chip,location,15
2025-01-16,Chocolate Chip,ubereats,8
2025-01-16,Oatmeal Raisin,wolt,5
2025-01-16,Double Chocolate,website,12`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verkaufsdaten_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const availableColumns = csvData.length > 0 ? Object.keys(csvData[0]).filter(key => key !== '_rowIndex') : [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">CSV-Import: Verkaufsdaten</h2>
            <p className="text-sm text-gray-600">Importieren Sie Verkaufsdaten von verschiedenen Plattformen</p>
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Vorlage</span>
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          accept=".csv"
          ref={fileRef}
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {filename && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Datei: {filename}</span>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Column Mapping */}
      {showPreview && csvData.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spalten zuordnen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                <select
                  value={columnMapping.date}
                  onChange={(e) => setColumnMapping({...columnMapping, date: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Spalte wählen...</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cookie-Name</label>
                <select
                  value={columnMapping.cookie}
                  onChange={(e) => setColumnMapping({...columnMapping, cookie: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Spalte wählen...</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plattform</label>
                <select
                  value={columnMapping.platform}
                  onChange={(e) => setColumnMapping({...columnMapping, platform: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Spalte wählen...</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anzahl</label>
                <select
                  value={columnMapping.amount}
                  onChange={(e) => setColumnMapping({...columnMapping, amount: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Spalte wählen...</option>
                  {availableColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleColumnMapping}
              className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Daten verarbeiten</span>
            </button>
          </div>

          {/* CSV Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV-Vorschau (erste 5 Zeilen)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    {availableColumns.map(col => (
                      <th key={col} className="px-2 py-1 text-left font-medium text-gray-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      {availableColumns.map(col => (
                        <td key={col} className="px-2 py-1 text-gray-600">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">... und {csvData.length - 5} weitere Zeilen</p>
            )}
          </div>
        </div>
      )}

      {/* Mapped Data Preview */}
      {mappedData.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Verarbeitete Daten ({mappedData.length} Einträge)</h3>
            <div className="overflow-x-auto max-h-60">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="px-2 py-1 text-left font-medium text-blue-800">Datum</th>
                    <th className="px-2 py-1 text-left font-medium text-blue-800">Cookie</th>
                    <th className="px-2 py-1 text-left font-medium text-blue-800">Plattform</th>
                    <th className="px-2 py-1 text-left font-medium text-blue-800">Anzahl</th>
                    <th className="px-2 py-1 text-left font-medium text-blue-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.slice(0, 10).map((item, idx) => {
                    const cookieExists = cookies.some(c => c.name.toLowerCase() === item.cookieName.toLowerCase());
                    const platformRecognized = Object.keys(platformMapping).includes(item.platform);
                    
                    return (
                      <tr key={idx} className="border-b border-blue-200">
                        <td className="px-2 py-1 text-blue-700">{item.date}</td>
                        <td className={`px-2 py-1 ${cookieExists ? 'text-blue-700' : 'text-red-600 font-medium'}`}>
                          {item.cookieName}
                        </td>
                        <td className={`px-2 py-1 ${platformRecognized ? 'text-blue-700' : 'text-amber-600'}`}>
                          {item.platform} {!platformRecognized && '(→ Vor Ort)'}
                        </td>
                        <td className="px-2 py-1 text-blue-700">{item.amount}</td>
                        <td className="px-2 py-1">
                          {cookieExists ? (
                            <span className="text-green-600 text-xs">✓ OK</span>
                          ) : (
                            <span className="text-red-600 text-xs">⚠ Cookie nicht gefunden</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {mappedData.length > 10 && (
              <p className="text-xs text-blue-600 mt-2">... und {mappedData.length - 10} weitere Einträge</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={resetState}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Abbrechen</span>
            </button>
            <button
              onClick={applyDataToSystem}
              disabled={processing}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{processing ? 'Importiere...' : 'In System übernehmen'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Platform Information */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">📋 Unterstützte Plattformen</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs text-amber-800">
          <div><strong>Vor Ort:</strong> location, vor ort, laden, shop</div>
          <div><strong>Uber Eats:</strong> ubereats, uber eats, uber</div>
          <div><strong>Wolt:</strong> wolt</div>
          <div><strong>Lieferando:</strong> lieferando</div>
          <div><strong>Website:</strong> website, online, web</div>
        </div>
        <p className="text-xs text-amber-700 mt-2">
          <strong>Hinweis:</strong> Nicht erkannte Plattformen werden automatisch als "Vor Ort" kategorisiert.
        </p>
      </div>

      {/* Expected Format */}
      <div className="mt-4 text-xs text-gray-500">
        <strong>Erwartetes CSV-Format:</strong> Datum (YYYY-MM-DD), Cookie-Name, Plattform, Anzahl
        <br />
        <strong>Beispiel:</strong> 2025-01-16, Chocolate Chip, ubereats, 8
      </div>
    </div>
  );
}

export default CSVUpload;