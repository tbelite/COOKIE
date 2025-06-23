import React from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Download, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { User } from '../data/users';

interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
}

interface WarnLevels {
  [ingredientName: string]: number;
}

interface EinkaufslisteProps {
  ingredients: Ingredient[];
  warnLevels?: WarnLevels;
  user: User;
}

export default function Einkaufsliste({ ingredients, warnLevels = {}, user }: EinkaufslisteProps) {
  const navigate = useNavigate();
  
  const knappe = ingredients.filter((ing) =>
    ing.amount < (warnLevels[ing.name] || ing.minStock || 2)
  );

  function exportCSV() {
    let csv = "Zutat,Aktueller_Bestand,Mindestbestand,Empfohlene_Bestellmenge,Kosten_pro_Einheit,Lieferant,Geschaetzte_Kosten\n";
    knappe.forEach(ing => {
      const minStock = warnLevels[ing.name] || ing.minStock || 2;
      const recommendedOrder = Math.max(minStock * 2 - ing.amount, minStock);
      const estimatedCost = recommendedOrder * ing.costPerUnit;
      
      csv += [
        `"${ing.name}"`,
        ing.amount,
        minStock,
        recommendedOrder,
        ing.costPerUnit.toFixed(2),
        `"${ing.supplier}"`,
        estimatedCost.toFixed(2)
      ].join(",") + "\n";
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `einkaufsliste_${new Date().toISOString().split('T')[0]}.csv`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const totalEstimatedCost = knappe.reduce((sum, ing) => {
    const minStock = warnLevels[ing.name] || ing.minStock || 2;
    const recommendedOrder = Math.max(minStock * 2 - ing.amount, minStock);
    return sum + (recommendedOrder * ing.costPerUnit);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/zutaten')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Einkaufsliste</h1>
                  <p className="text-sm sm:text-base text-gray-600">Automatische Bestellvorschläge</p>
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

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Zu bestellen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{knappe.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Geschätzte Kosten</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">€{totalEstimatedCost.toFixed(2)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ausreichend</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{ingredients.length - knappe.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Einkaufsvorschlag</h2>
              {knappe.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Als CSV exportieren</span>
                </button>
              )}
            </div>
          </div>

          {knappe.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Alle Zutaten ausreichend auf Lager!</h3>
              <p className="text-gray-500">Keine Bestellungen erforderlich.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Zutat</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">Bestand</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">Mindest</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">Bestellen</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Lieferant</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  {knappe.map((ing, i) => {
                    const minStock = warnLevels[ing.name] || ing.minStock || 2;
                    const recommendedOrder = Math.max(minStock * 2 - ing.amount, minStock);
                    const estimatedCost = recommendedOrder * ing.costPerUnit;
                    const urgency = ing.amount / minStock;
                    
                    return (
                      <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${
                        urgency <= 0.5 ? 'bg-red-25' : urgency <= 0.8 ? 'bg-amber-25' : ''
                      }`}>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{ing.name}</div>
                            <div className="text-sm text-gray-500">{ing.unit}</div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            urgency <= 0.5 ? 'bg-red-100 text-red-800' :
                            urgency <= 0.8 ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ing.amount}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {minStock}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {recommendedOrder}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-900">{ing.supplier}</span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-green-600">€{estimatedCost.toFixed(2)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 font-semibold text-gray-900">
                      Geschätzte Gesamtkosten:
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-green-600">
                      €{totalEstimatedCost.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Hinweise zur Einkaufsliste</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Bestellmenge:</strong> Empfohlen wird das Doppelte des Mindestbestands minus aktueller Bestand</p>
            <p>• <strong>Dringlichkeit:</strong> Rot = kritisch (≤50% Mindestbestand), Gelb = niedrig (≤80% Mindestbestand)</p>
            <p>• <strong>Kosten:</strong> Geschätzte Kosten basierend auf den hinterlegten Preisen pro Einheit</p>
            <p>• <strong>Export:</strong> CSV-Export für einfache Weiterverarbeitung in anderen Systemen</p>
          </div>
        </div>
      </div>
    </div>
  );
}