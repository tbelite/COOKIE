import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, AlertTriangle, CheckCircle, Save, FileText, TrendingUp, TrendingDown, Package, Calendar, User as UserIcon } from 'lucide-react';
import { User } from '../data/users';

interface DailyData {
  sold: number;
  prepared: number;
  used: number;
  trash: number;
  new: number;
  inventur?: number; // Add inventory completion value
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
  sollBestand?: number; // Add target stock level
}

interface InventoryAuditItem {
  cookie: string;
  soll: number;
  ist_lager_verpackt: number;
  ist_lager_versand: number;
  ist_location: number;
  ist_final: number;
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

interface WarnLevels {
  [cookieName: string]: number;
}

interface InventurModusProps {
  cookies: CookieData[];
  updateCookies: (cookies: CookieData[]) => void;
  user: User;
  inventoryAudits: InventoryAudit[];
  setInventoryAudits: (audits: InventoryAudit[]) => void;
  warnLevels: WarnLevels;
}

function InventurModus({ 
  cookies, 
  updateCookies, 
  user, 
  inventoryAudits, 
  setInventoryAudits, 
  warnLevels 
}: InventurModusProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  // Three fields per cookie for different storage locations
  const [istLagerVerpackt, setIstLagerVerpackt] = useState<string[]>(cookies.map(() => ""));
  const [istLagerVersand, setIstLagerVersand] = useState<string[]>(cookies.map(() => ""));
  const [istLocation, setIstLocation] = useState<string[]>(cookies.map(() => ""));
  const [kommentare, setKommentare] = useState<string[]>(cookies.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate expected stock (Soll) based on current sollBestand or historical data
  const soll = cookies.map(cookie => {
    // Use existing sollBestand if available, otherwise calculate from history
    if (cookie.sollBestand !== undefined) {
      return cookie.sollBestand;
    }
    
    // Fallback: calculate from historical data
    return Object.values(cookie.history || {}).reduce((acc, day) => 
      acc + (day.prepared || 0) - (day.sold || 0) - (day.trash || 0), 0
    );
  });

  // Calculate total IST stock from all locations
  const istFinal = cookies.map((_, i) =>
    [istLagerVerpackt[i], istLagerVersand[i], istLocation[i]]
      .map(Number)
      .filter(v => !isNaN(v))
      .reduce((a, b) => a + b, 0)
  );

  // Calculate differences (IST - SOLL)
  const differenzen = istFinal.map((val, i) =>
    val === 0 && istLagerVerpackt[i] === "" && istLagerVersand[i] === "" && istLocation[i] === "" 
      ? null 
      : val - soll[i]
  );

  // Check for low stock warnings
  const lowStock = istFinal.map((val, i) =>
    val !== 0 && val < (warnLevels[cookies[i].name] || 10)
  );

  // Calculate total difference for audit summary
  const totalDifference = differenzen.reduce((sum, diff) => 
    sum + (diff !== null ? Math.abs(diff) : 0), 0
  );

  // Check if audit is complete (at least one field filled for each cookie)
  const isComplete = cookies.every((_, i) => 
    istLagerVerpackt[i] !== "" || istLagerVersand[i] !== "" || istLocation[i] !== ""
  );

  const handleFieldChange = (
    index: number, 
    field: 'verpackt' | 'versand' | 'location' | 'kommentar', 
    value: string
  ) => {
    switch (field) {
      case 'verpackt':
        const newVerpackt = [...istLagerVerpackt];
        newVerpackt[index] = value;
        setIstLagerVerpackt(newVerpackt);
        break;
      case 'versand':
        const newVersand = [...istLagerVersand];
        newVersand[index] = value;
        setIstLagerVersand(newVersand);
        break;
      case 'location':
        const newLocation = [...istLocation];
        newLocation[index] = value;
        setIstLocation(newLocation);
        break;
      case 'kommentar':
        const newKommentare = [...kommentare];
        newKommentare[index] = value;
        setKommentare(newKommentare);
        break;
    }
  };

  // Enhanced inventory completion function based on your specifications
  const inventurAbschliessen = (inventurWerte: Array<{verpackt: number, versand: number, location: number}>) => {
    const updatedCookies = cookies.map((cookie, idx) => {
      const ist = 
        (inventurWerte[idx]?.verpackt || 0) +
        (inventurWerte[idx]?.versand || 0) +
        (inventurWerte[idx]?.location || 0);
      
      return {
        ...cookie,
        stock: Math.max(0, ist - cookie.prepared), // Update actual stock, keeping prepared separate
        sollBestand: ist, // ✅ IMPORTANT: Set new SOLL to the counted IST amount
        history: {
          ...cookie.history,
          [today]: {
            ...(cookie.history?.[today] || {}),
            inventur: ist // Document inventory completion in daily history
          }
        }
      };
    });
    
    // Update cookies state
    updateCookies(updatedCookies);
    
    // Also save to localStorage for persistence
    localStorage.setItem("cookies", JSON.stringify(updatedCookies));
  };

  // Alternative function for localStorage direct update (as per your second function)
  const updateAllCookiesSollBestand = (inventurWerte: Array<{verpackt: number, versand: number, location: number}>) => {
    const cookies = JSON.parse(localStorage.getItem("cookies") || "[]");
    const today = new Date().toISOString().split("T")[0];
    const newCookies = cookies.map((cookie: any, idx: number) => {
      const ist =
        (inventurWerte[idx]?.verpackt || 0) +
        (inventurWerte[idx]?.versand || 0) +
        (inventurWerte[idx]?.location || 0);
      return {
        ...cookie,
        sollBestand: ist, // ✅ Set new SOLL to IST amount
        stock: Math.max(0, ist - (cookie.prepared || 0)),
        history: {
          ...cookie.history,
          [today]: {
            ...(cookie.history?.[today] || {}),
            inventur: ist
          }
        }
      };
    });
    localStorage.setItem("cookies", JSON.stringify(newCookies));
  };

  const handleSubmit = () => {
    if (!isComplete) return;
    
    const auditId = `audit_${Date.now()}`;
    const auditItems: InventoryAuditItem[] = cookies.map((cookie, i) => ({
      cookie: cookie.name,
      soll: soll[i],
      ist_lager_verpackt: Number(istLagerVerpackt[i]) || 0,
      ist_lager_versand: Number(istLagerVersand[i]) || 0,
      ist_location: Number(istLocation[i]) || 0,
      ist_final: istFinal[i],
      differenz: differenzen[i] || 0,
      kommentar: kommentare[i] || ""
    }));

    const audit: InventoryAudit = {
      id: auditId,
      date: today,
      user: user.email,
      userName: user.name,
      items: auditItems,
      totalDifference,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Prepare inventory values for completion function
    const inventurWerte = cookies.map((_, i) => ({
      verpackt: Number(istLagerVerpackt[i]) || 0,
      versand: Number(istLagerVersand[i]) || 0,
      location: Number(istLocation[i]) || 0
    }));

    // Complete inventory and update stock levels using your function
    inventurAbschliessen(inventurWerte);

    // Also update localStorage directly for redundancy
    updateAllCookiesSollBestand(inventurWerte);

    // Save audit log
    setInventoryAudits([...inventoryAudits, audit]);
    
    setSubmitted(true);
    setShowConfirmation(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIstLagerVerpackt(cookies.map(() => ""));
      setIstLagerVersand(cookies.map(() => ""));
      setIstLocation(cookies.map(() => ""));
      setKommentare(cookies.map(() => ""));
      setSubmitted(false);
      setShowConfirmation(false);
    }, 3000);
  };

  const getStatusColor = (difference: number | null) => {
    if (difference === null) return "text-gray-400";
    if (difference === 0) return "text-green-600";
    if (Math.abs(difference) <= 2) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusIcon = (difference: number | null) => {
    if (difference === null) return null;
    if (difference === 0) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

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
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Inventur-Modus</h1>
                  <p className="text-sm sm:text-base text-gray-600">Bestandsaufnahme mit automatischer SOLL-Aktualisierung</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/inventur-log')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Inventurprotokoll</span>
                <span className="sm:hidden">Protokoll</span>
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Durchgeführt von</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-amber-600 uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Success Message */}
        {showConfirmation && (
          <div className="mb-6 p-4 sm:p-6 bg-green-100 border border-green-200 rounded-xl flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Inventur erfolgreich abgeschlossen!</h3>
              <p className="text-sm text-green-700">
                Bestandsabweichungen wurden dokumentiert und SOLL-Bestände auf IST-Werte aktualisiert.
              </p>
            </div>
          </div>
        )}

        {/* Audit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Zu prüfen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{cookies.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Erfasst</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {cookies.filter((_, i) => 
                    istLagerVerpackt[i] !== "" || istLagerVersand[i] !== "" || istLocation[i] !== ""
                  ).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Abweichungen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalDifference}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Datum</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{today}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bestandsaufnahme mit Lagerorten</h2>
            <p className="text-sm text-gray-600 mt-1">
              Nach dem Speichern wird der SOLL-Bestand auf den gezählten IST-Wert aktualisiert
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cookie-Sorte</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">
                    Aktueller SOLL
                    <div className="text-xs font-normal text-gray-500">wird zu IST</div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Lager Verpackt</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Lager Versand</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Location</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">
                    IST Gesamt
                    <div className="text-xs font-normal text-gray-500">wird neuer SOLL</div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Differenz</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Kommentar</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((cookie, i) => {
                  const difference = differenzen[i];
                  const isLowStock = lowStock[i];
                  const hasData = istLagerVerpackt[i] !== "" || istLagerVersand[i] !== "" || istLocation[i] !== "";
                  
                  return (
                    <tr key={cookie.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{cookie.name}</div>
                          <div className="text-sm text-gray-500">
                            {cookie.category} • Aktuell: {cookie.stock + cookie.prepared}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {soll[i]}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">→ {istFinal[i] || 0}</div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          className="w-16 border border-gray-300 rounded-lg p-2 text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={istLagerVerpackt[i]}
                          onChange={(e) => handleFieldChange(i, 'verpackt', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="text-center py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          className="w-16 border border-gray-300 rounded-lg p-2 text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={istLagerVersand[i]}
                          onChange={(e) => handleFieldChange(i, 'versand', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="text-center py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          className="w-16 border border-gray-300 rounded-lg p-2 text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={istLocation[i]}
                          onChange={(e) => handleFieldChange(i, 'location', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`text-lg font-bold ${
                          isLowStock ? "text-red-600" : "text-green-600"
                        }`}>
                          {istFinal[i] || 0}
                        </span>
                        {isLowStock && (
                          <div className="text-xs text-red-600 mt-1 flex items-center justify-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Unter Mindestbestand
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {difference !== null && (
                          <div className="flex items-center justify-center space-x-1">
                            {getStatusIcon(difference)}
                            <span className={`font-bold text-sm ${getStatusColor(difference)}`}>
                              {difference > 0 ? `+${difference}` : difference}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          value={kommentare[i]}
                          onChange={(e) => handleFieldChange(i, 'kommentar', e.target.value)}
                          placeholder="Kommentar (optional)"
                        />
                      </td>
                      <td className="text-center py-3 px-2">
                        {hasData ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full mx-auto"></div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Storage Location Info */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lagerorte Erklärung:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <strong>Lager Verpackt:</strong> Fertig verpackte Cookies im Hauptlager
              </div>
              <div>
                <strong>Lager Versand:</strong> Cookies bereit für den Versand
              </div>
              <div>
                <strong>Location:</strong> Sonstige Lagerorte oder Filialen
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitted}
            className={`flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-200 ${
              isComplete && !submitted
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4 sm:h-6 sm:w-6" />
            <span>
              {submitted ? "Inventur abgeschlossen & SOLL aktualisiert" : "Inventur abschließen & SOLL auf IST setzen"}
            </span>
          </button>

          <button
            onClick={() => navigate('/inventur-log')}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm sm:text-lg"
          >
            <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
            <span>Inventurprotokoll anzeigen</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Fortschritt</span>
            <span>
              {cookies.filter((_, i) => 
                istLagerVerpackt[i] !== "" || istLagerVersand[i] !== "" || istLocation[i] !== ""
              ).length} von {cookies.length} erfasst
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${(cookies.filter((_, i) => 
                  istLagerVerpackt[i] !== "" || istLagerVersand[i] !== "" || istLocation[i] !== ""
                ).length / cookies.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Enhanced Information Panel */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">🔄 SOLL-Bestand Aktualisierung</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Vor Inventur:</strong> SOLL-Bestand zeigt den erwarteten Zielwert</p>
            <p>• <strong>Nach Inventur:</strong> SOLL-Bestand wird automatisch auf den gezählten IST-Wert gesetzt</p>
            <p>• <strong>Beispiel:</strong> SOLL war 100, IST gezählt 95 → neuer SOLL wird 95</p>
            <p>• <strong>Zweck:</strong> Zukünftige Inventuren verwenden die aktualisierten SOLL-Werte als Basis</p>
            <p>• <strong>Audit-Trail:</strong> Alle Änderungen werden im Inventurprotokoll dokumentiert</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventurModus;