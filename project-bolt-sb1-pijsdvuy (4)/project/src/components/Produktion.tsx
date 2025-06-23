import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, Clock, Euro, TrendingUp, AlertTriangle, CheckCircle, Package, Beaker } from 'lucide-react';

interface DailyData {
  sold: number;
  prepared: number;
  used: number;
  trash: number;
  new: number;
  produziert?: number;
}

interface CookieData {
  id: number;
  name: string;
  sold: number;
  stock: number;
  prepared: number;
  price: number;
  productionPrice: number;
  category: string;
  history: Record<string, DailyData>;
}

interface Settings {
  costPerCookie: number;
  costPerHour: number;
}

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

interface Recipe {
  cookieId: number;
  ingredients: { [ingredientId: number]: number };
  yield: number;
  notes: string;
}

interface ProduktionProps {
  cookies: CookieData[];
  updateCookies: (cookies: CookieData[]) => void;
  updateCookieDay?: (cookieId: number, values: Partial<DailyData>, date?: string) => void;
  settings: Settings;
  handleProduction?: (cookieId: number, quantity: number) => void;
  ingredients?: Ingredient[];
  recipes?: Recipe[];
}

function Produktion({ 
  cookies, 
  updateCookies, 
  updateCookieDay, 
  settings, 
  handleProduction,
  ingredients = [],
  recipes = []
}: ProduktionProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const cookie = cookies.find(c => c.id === Number(id));

  const [newCookies, setNewCookies] = useState(0);
  const [hours, setHours] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Get recipe for this cookie
  const recipe = recipes.find(r => r.cookieId === cookie.id);

  // Verwende cookie-spezifische Produktionskosten
  const materialCostPerCookie = Number(cookie.productionPrice || 0);
  const costPerMinute = Number(settings.costPerHour || 0) / 60;

  // Berechnungen
  const totalMinutes = hours * 60;
  const cookiesPerMinute = totalMinutes > 0 ? (newCookies / totalMinutes) : 0;
  const laborCostPerCookie = newCookies > 0 ? ((totalMinutes * costPerMinute) / newCookies) : 0;
  const totalCostPerCookie = materialCostPerCookie + laborCostPerCookie;
  const profitMargin = cookie.price - totalCostPerCookie;
  const profitPercentage = totalCostPerCookie > 0 ? ((profitMargin / cookie.price) * 100) : 0;
  const totalProductionCost = newCookies * totalCostPerCookie;
  const totalRevenue = newCookies * cookie.price;
  const totalProfit = totalRevenue - totalProductionCost;

  // Check ingredient availability
  const checkIngredientAvailability = () => {
    if (!recipe || newCookies === 0) return [];
    
    const multiplier = newCookies / recipe.yield;
    return Object.entries(recipe.ingredients).map(([ingredientId, amount]) => {
      const ingredient = ingredients.find(ing => ing.id === Number(ingredientId));
      const required = amount * multiplier;
      const available = ingredient?.amount || 0;
      return {
        ingredient,
        required,
        available,
        sufficient: available >= required
      };
    }).filter(item => item.ingredient);
  };

  const ingredientCheck = checkIngredientAvailability();
  const hasInsufficientIngredients = ingredientCheck.some(item => !item.sufficient);

  // Get today's production data
  const getTodayProduction = () => {
    const today = new Date().toISOString().split('T')[0];
    return cookie.history[today]?.produziert || 0;
  };

  const handleProductionSubmit = () => {
    if (newCookies > 0 && !hasInsufficientIngredients) {
      if (handleProduction) {
        // Use the enhanced production function that handles ingredient consumption
        handleProduction(cookie.id, newCookies);
      } else {
        // Fallback to old method
        const updatedCookies = cookies.map(c => 
          c.id === cookie.id 
            ? { ...c, prepared: c.prepared + newCookies }
            : c
        );
        updateCookies(updatedCookies);

        // Update today's production data if updateCookieDay is available
        if (updateCookieDay) {
          const today = new Date().toISOString().split('T')[0];
          const currentDayData = cookie.history[today] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0, produziert: 0 };
          updateCookieDay(cookie.id, { 
            ...currentDayData, 
            new: currentDayData.new + newCookies,
            produziert: (currentDayData.produziert || 0) + newCookies
          });
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setNewCookies(0);
        setHours(0);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/cookie/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Produktionsrechner</h1>
                <p className="text-sm sm:text-base text-gray-600">{cookie.name} • €{cookie.price}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span className="text-green-800 font-medium text-sm sm:text-base">
              {newCookies} Cookies erfolgreich produziert! Zutaten wurden automatisch abgezogen.
            </span>
          </div>
        )}

        {/* Today's Production Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Heutige Produktion</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Bereits produziert heute:</span>
              <span className="font-bold text-blue-600">{getTodayProduction()} Stück</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Produktionsplanung</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Neue Cookies produziert
                </label>
                <input
                  type="number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-lg"
                  value={newCookies}
                  min={0}
                  onChange={e => setNewCookies(Number(e.target.value))}
                  placeholder="z.B. 500"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Mitarbeiter-Arbeitsstunden
                </label>
                <input
                  type="number"
                  step={0.1}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-lg"
                  value={hours}
                  min={0}
                  onChange={e => setHours(Number(e.target.value))}
                  placeholder="z.B. 10"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Kostenbasis für {cookie.name}</h3>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materialkosten pro Cookie:</span>
                    <span className="font-medium">€{materialCostPerCookie.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arbeitskosten pro Stunde:</span>
                    <span className="font-medium">€{Number(settings.costPerHour || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 sm:pt-2">
                    <span className="text-gray-600">Verkaufspreis:</span>
                    <span className="font-medium text-green-600">€{cookie.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Ingredient Availability Check */}
            {recipe && newCookies > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Beaker className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                  Zutaten-Verfügbarkeit
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {ingredientCheck.map((item, index) => (
                    <div key={index} className={`flex justify-between items-center p-2 rounded-lg ${
                      item.sufficient ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div>
                        <span className="text-sm font-medium">{item.ingredient?.name}</span>
                        <div className="text-xs text-gray-500">
                          Benötigt: {item.required.toFixed(2)} {item.ingredient?.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          item.sufficient ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.available.toFixed(2)} {item.ingredient?.unit}
                        </span>
                        <div className="text-xs">
                          {item.sufficient ? '✓ Ausreichend' : '⚠ Nicht genug'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasInsufficientIngredients && (
                  <div className="mt-3 p-2 sm:p-3 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    <span className="text-xs sm:text-sm text-red-700 font-medium">
                      Warnung: Nicht genügend Zutaten für diese Produktion verfügbar!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Efficiency Metrics */}
            {(newCookies > 0 && hours > 0) && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  Effizienz
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Cookies pro Minute:</span>
                    <span className="text-lg sm:text-xl font-bold text-blue-600">
                      {cookiesPerMinute.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Arbeitszeit gesamt:</span>
                    <span className="font-semibold">{totalMinutes} Min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cost Analysis */}
            {(newCookies > 0 && hours > 0) && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Euro className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
                  Kostenanalyse
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Kosten pro Cookie:</span>
                    <span className="text-lg sm:text-xl font-bold text-red-600">
                      €{totalCostPerCookie.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Gesamtkosten:</span>
                    <span className="font-semibold text-red-600">
                      €{totalProductionCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Material: €{(newCookies * materialCostPerCookie).toFixed(2)}</div>
                    <div>Arbeitszeit: €{(totalMinutes * costPerMinute).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Profit Analysis */}
            {(newCookies > 0 && hours > 0) && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  Gewinnanalyse
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Gewinn pro Cookie:</span>
                    <span className={`text-lg sm:text-xl font-bold ${profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{profitMargin.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Gewinnmarge:</span>
                    <span className={`font-bold ${profitPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Gesamtgewinn:</span>
                    <span className={`text-lg sm:text-xl font-bold ${totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{totalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {profitMargin <= 0 && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2" />
                      <span className="text-xs sm:text-sm text-red-700 font-medium">
                        Warnung: Die Produktionskosten übersteigen den Verkaufspreis!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={handleProductionSubmit}
            disabled={newCookies <= 0 || showSuccess || hasInsufficientIngredients}
            className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-lg font-semibold"
          >
            <Calculator className="h-4 w-4 sm:h-6 sm:w-6" />
            <span>
              {hasInsufficientIngredients 
                ? 'Nicht genügend Zutaten' 
                : 'Produktion starten & Zutaten abziehen'
              }
            </span>
          </button>
        </div>

        {/* Recipe Information */}
        {recipe && (
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">🧾 Rezept-Information</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Ausbeute:</strong> {recipe.yield} Cookies pro Charge</p>
              <p>• <strong>Zutaten werden automatisch abgezogen</strong> basierend auf dem hinterlegten Rezept</p>
              <p>• <strong>Multiplier:</strong> {newCookies > 0 ? (newCookies / recipe.yield).toFixed(2) : '0'} Chargen für {newCookies} Cookies</p>
              {recipe.notes && <p>• <strong>Notizen:</strong> {recipe.notes}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Produktion;