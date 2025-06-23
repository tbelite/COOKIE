import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Save, Calculator, AlertTriangle, CheckCircle, Plus, Minus, Euro, Package } from 'lucide-react';
import { User } from '../data/users';
import { loadFromStorage, saveToStorage } from '../utils';

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
  yield: number; // How many cookies this recipe produces
  notes: string;
}

interface RezepturenSettingsProps {
  cookies: CookieData[];
  ingredients: Ingredient[];
  user: User;
}

function RezepturenSettings({ cookies, ingredients, user }: RezepturenSettingsProps) {
  const navigate = useNavigate();
  
  // Load recipes from localStorage
  const [recipes, setRecipes] = useState<Recipe[]>(() => 
    loadFromStorage("recipes", cookies.map(cookie => ({
      cookieId: cookie.id,
      ingredients: {},
      yield: 100, // Default: recipe makes 100 cookies
      notes: ""
    })))
  );
  
  const [saved, setSaved] = useState(false);
  const [selectedCookie, setSelectedCookie] = useState<number>(cookies[0]?.id || 0);

  // Auto-save recipes to localStorage
  useEffect(() => {
    saveToStorage("recipes", recipes);
  }, [recipes]);

  // Get recipe for selected cookie
  const getCurrentRecipe = () => {
    return recipes.find(r => r.cookieId === selectedCookie) || {
      cookieId: selectedCookie,
      ingredients: {},
      yield: 100,
      notes: ""
    };
  };

  // Update ingredient amount in recipe
  const updateIngredientAmount = (ingredientId: number, amount: number) => {
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.cookieId === selectedCookie
          ? {
              ...recipe,
              ingredients: {
                ...recipe.ingredients,
                [ingredientId]: amount
              }
            }
          : recipe
      )
    );
    setSaved(false);
  };

  // Update recipe yield
  const updateYield = (newYield: number) => {
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.cookieId === selectedCookie
          ? { ...recipe, yield: newYield }
          : recipe
      )
    );
    setSaved(false);
  };

  // Update recipe notes
  const updateNotes = (notes: string) => {
    setRecipes(prev => 
      prev.map(recipe => 
        recipe.cookieId === selectedCookie
          ? { ...recipe, notes }
          : recipe
      )
    );
    setSaved(false);
  };

  // Calculate total cost per batch
  const calculateBatchCost = (recipe: Recipe) => {
    return Object.entries(recipe.ingredients).reduce((total, [ingredientId, amount]) => {
      const ingredient = ingredients.find(ing => ing.id === Number(ingredientId));
      return total + (ingredient ? ingredient.costPerUnit * amount : 0);
    }, 0);
  };

  // Calculate cost per cookie
  const calculateCostPerCookie = (recipe: Recipe) => {
    const batchCost = calculateBatchCost(recipe);
    return recipe.yield > 0 ? batchCost / recipe.yield : 0;
  };

  // Check if enough ingredients are available for production
  const checkIngredientAvailability = (recipe: Recipe, quantity: number) => {
    const multiplier = quantity / recipe.yield;
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
    });
  };

  // Save all recipes
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Copy recipe from another cookie
  const copyRecipe = (fromCookieId: number) => {
    const sourceRecipe = recipes.find(r => r.cookieId === fromCookieId);
    if (sourceRecipe) {
      setRecipes(prev => 
        prev.map(recipe => 
          recipe.cookieId === selectedCookie
            ? {
                ...recipe,
                ingredients: { ...sourceRecipe.ingredients },
                yield: sourceRecipe.yield,
                notes: `Kopiert von ${cookies.find(c => c.id === fromCookieId)?.name || 'Unbekannt'}`
              }
            : recipe
        )
      );
      setSaved(false);
    }
  };

  const currentRecipe = getCurrentRecipe();
  const selectedCookieData = cookies.find(c => c.id === selectedCookie);
  const batchCost = calculateBatchCost(currentRecipe);
  const costPerCookie = calculateCostPerCookie(currentRecipe);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                  <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Cookie Rezepturen</h1>
                  <p className="text-sm sm:text-base text-gray-600">Zutaten und Mengen für jede Cookie-Sorte</p>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Success Message */}
        {saved && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span className="text-green-800 font-medium text-sm sm:text-base">
              Alle Rezepturen erfolgreich gespeichert!
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cookie Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cookie auswählen</h2>
              <div className="space-y-2">
                {cookies.map(cookie => (
                  <button
                    key={cookie.id}
                    onClick={() => setSelectedCookie(cookie.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCookie === cookie.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-25'
                    }`}
                  >
                    <div className="font-medium">{cookie.name}</div>
                    <div className="text-sm text-gray-500">{cookie.category}</div>
                  </button>
                ))}
              </div>

              {/* Copy Recipe */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Rezept kopieren</h3>
                <select
                  onChange={(e) => e.target.value && copyRecipe(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  defaultValue=""
                >
                  <option value="">Von anderem Cookie kopieren...</option>
                  {cookies
                    .filter(c => c.id !== selectedCookie)
                    .map(cookie => (
                      <option key={cookie.id} value={cookie.id}>
                        {cookie.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recipe Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Rezept für {selectedCookieData?.name}
                </h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">
                    €{costPerCookie.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">pro Cookie</div>
                </div>
              </div>

              {/* Yield Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ausbeute (Anzahl Cookies)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentRecipe.yield}
                    onChange={(e) => updateYield(Number(e.target.value))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gesamtkosten pro Charge
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-lg font-bold text-gray-900">€{batchCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen & Anweisungen
                </label>
                <textarea
                  value={currentRecipe.notes}
                  onChange={(e) => updateNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="Besondere Anweisungen, Tipps oder Hinweise..."
                />
              </div>
            </div>

            {/* Ingredients List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Zutaten</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mengen für {currentRecipe.yield} Cookies
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {ingredients.map(ingredient => {
                  const amount = currentRecipe.ingredients[ingredient.id] || 0;
                  const cost = amount * ingredient.costPerUnit;
                  const isUsed = amount > 0;

                  return (
                    <div key={ingredient.id} className={`p-4 sm:p-6 ${isUsed ? 'bg-amber-25' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                          <div className="text-sm text-gray-500">
                            Verfügbar: {ingredient.amount} {ingredient.unit} • 
                            €{ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                          </div>
                        </div>
                        {isUsed && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-amber-600">
                              €{cost.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Kosten</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateIngredientAmount(ingredient.id, Math.max(0, amount - 0.1))}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        
                        <div className="flex-1 max-w-32">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={amount}
                            onChange={(e) => updateIngredientAmount(ingredient.id, Number(e.target.value))}
                            className="w-full p-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        
                        <span className="text-sm text-gray-600 min-w-[3rem]">
                          {ingredient.unit}
                        </span>
                        
                        <button
                          onClick={() => updateIngredientAmount(ingredient.id, amount + 0.1)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Availability Warning */}
                      {amount > ingredient.amount && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-700">
                            Nicht genügend auf Lager! Benötigt: {amount} {ingredient.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Calculator */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Produktionsrechner</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gewünschte Menge
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue="100"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    onChange={(e) => {
                      const quantity = Number(e.target.value);
                      const availability = checkIngredientAvailability(currentRecipe, quantity);
                      // You could show this in a modal or expand the section
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benötigte Chargen
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="font-medium">
                      {Math.ceil(100 / currentRecipe.yield)} Chargen
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geschätzte Kosten
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="font-medium text-green-600">
                      €{(100 * costPerCookie).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-lg font-semibold"
              >
                <Save className="h-4 w-4 sm:h-6 sm:w-6" />
                <span>Alle Rezepturen speichern</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RezepturenSettings;