import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CookieDetail from './components/CookieDetail';
import Produktion from './components/Produktion';
import DailyTracking from './components/DailyTracking';
import TagesInfo from './components/TagesInfo';
import Settings from './components/Settings';
import Login from './components/Login';
import Stats from './components/Stats';
import AdvancedStats from './components/AdvancedStats';
import ZutatenInventar from './components/ZutatenInventar';
import InventurModus from './components/InventurModus';
import InventurLog from './components/InventurLog';
import ToDos from './components/ToDos';
import RezepturenSettings from './components/RezepturenSettings';
import WebsiteSettings from './components/WebsiteSettings';
import Produktionsplanung from './components/Produktionsplanung';
import Einkaufsliste from './components/Einkaufsliste';
import UserManagement from './components/UserManagement';
import { User } from './data/users';
import { loadFromStorage, saveToStorage } from './utils';
import { initialIngredients, Ingredient } from './data/initialIngredients';

interface DailyData {
  sold: number;
  prepared: number;
  used: number;
  trash: number;
  new: number;
  produziert?: number; // Add production tracking
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

interface WebsiteSettings {
  companyName: string;
  logo: string | null;
  backgroundColor: string;
  textColor: string;
  buttonBgColor: string;
}

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

interface WarnLevels {
  [cookieName: string]: number;
}

interface Recipe {
  cookieId: number;
  ingredients: { [ingredientId: number]: number };
  yield: number;
  notes: string;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Fresh initial cookies with no history and zero values
const initialCookies: CookieData[] = [
  {
    id: 1,
    name: "Chocolate Chip",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.50,
    productionPrice: 0.75,
    category: "Classic",
    history: {}
  },
  {
    id: 2,
    name: "Oatmeal Raisin",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.25,
    productionPrice: 0.65,
    category: "Classic",
    history: {}
  },
  {
    id: 3,
    name: "Double Chocolate",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.75,
    productionPrice: 0.85,
    category: "Premium",
    history: {}
  },
  {
    id: 4,
    name: "Peanut Butter",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.40,
    productionPrice: 0.70,
    category: "Classic",
    history: {}
  },
  {
    id: 5,
    name: "White Chocolate Macadamia",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 3.00,
    productionPrice: 0.95,
    category: "Premium",
    history: {}
  },
  {
    id: 6,
    name: "Snickerdoodle",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.35,
    productionPrice: 0.60,
    category: "Seasonal",
    history: {}
  },
  {
    id: 7,
    name: "Lemon",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.60,
    productionPrice: 0.80,
    category: "Seasonal",
    history: {}
  },
  {
    id: 8,
    name: "Red Velvet",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.85,
    productionPrice: 0.90,
    category: "Premium",
    history: {}
  },
  {
    id: 9,
    name: "Salted Caramel",
    sold: 0,
    stock: 0,
    prepared: 0,
    price: 2.90,
    productionPrice: 0.85,
    category: "Premium",
    history: {}
  }
];

const initialWarnLevels: WarnLevels = {
  "Chocolate Chip": 20,
  "Oatmeal Raisin": 15,
  "Double Chocolate": 25,
  "Peanut Butter": 10,
  "White Chocolate Macadamia": 18,
  "Snickerdoodle": 12,
  "Lemon": 8,
  "Red Velvet": 15,
  "Salted Caramel": 20
};

function App() {
  // Login-Status
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // App-State - Initialize with defaults, load from storage after mount
  const [cookies, setCookies] = useState<CookieData[]>(initialCookies);
  const [settings, setSettings] = useState<Settings>({ costPerCookie: 0.7, costPerHour: 60 });
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>({
    companyName: "Cookie Business",
    logo: null,
    backgroundColor: "#fef3c7", // amber-100
    textColor: "#1f2937", // gray-800
    buttonBgColor: "#f59e0b", // amber-500
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [inventoryAudits, setInventoryAudits] = useState<InventoryAudit[]>([]);
  const [warnLevels, setWarnLevels] = useState<WarnLevels>(initialWarnLevels);
  const [recipes, setRecipes] = useState<Recipe[]>(
    initialCookies.map(cookie => ({
      cookieId: cookie.id,
      ingredients: {},
      yield: 100,
      notes: ""
    }))
  );

  // Initialize app data from localStorage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load data from localStorage
        const storedCookies = loadFromStorage("cookies", null);
        const storedSettings = loadFromStorage("settings", null);
        const storedWebsiteSettings = loadFromStorage("websiteSettings", null);
        const storedIngredients = loadFromStorage("ingredients", null);
        const storedInventoryAudits = loadFromStorage("inventoryAudits", null);
        const storedWarnLevels = loadFromStorage("warnLevels", null);
        const storedRecipes = loadFromStorage("recipes", null);

        // Update state with stored data if available
        if (storedCookies && Array.isArray(storedCookies) && storedCookies.length > 0) {
          setCookies(storedCookies);
        }
        
        if (storedSettings) {
          setSettings(storedSettings);
        }
        
        if (storedWebsiteSettings) {
          setWebsiteSettings(storedWebsiteSettings);
        }
        
        if (storedIngredients && Array.isArray(storedIngredients) && storedIngredients.length > 0) {
          setIngredients(storedIngredients);
        }
        
        if (storedInventoryAudits && Array.isArray(storedInventoryAudits)) {
          setInventoryAudits(storedInventoryAudits);
        }
        
        if (storedWarnLevels) {
          setWarnLevels(storedWarnLevels);
        }
        
        if (storedRecipes && Array.isArray(storedRecipes) && storedRecipes.length > 0) {
          setRecipes(storedRecipes);
        }

        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        // Even if there's an error, mark as initialized to prevent infinite loading
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Auto-save to localStorage (only after initialization)
  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("cookies", cookies); 
    }
  }, [cookies, isInitialized]);
  
  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("settings", settings); 
    }
  }, [settings, isInitialized]);
  
  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("websiteSettings", websiteSettings); 
    }
  }, [websiteSettings, isInitialized]);

  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("ingredients", ingredients); 
    }
  }, [ingredients, isInitialized]);

  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("inventoryAudits", inventoryAudits); 
    }
  }, [inventoryAudits, isInitialized]);

  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("warnLevels", warnLevels); 
    }
  }, [warnLevels, isInitialized]);

  useEffect(() => { 
    if (isInitialized) {
      saveToStorage("recipes", recipes); 
    }
  }, [recipes, isInitialized]);

  const updateCookies = (updatedCookies: CookieData[]) => {
    setCookies(updatedCookies);
  };

  // Enhanced production function with ingredient consumption
  const produziereCookie = (cookieId: number, anzahlProduziert: number) => {
    const recipe = recipes.find(r => r.cookieId === cookieId);
    if (!recipe) return;

    const multiplier = anzahlProduziert / recipe.yield;

    // Deduct ingredients based on recipe
    setIngredients(prev => 
      prev.map(ingredient => {
        const requiredAmount = (recipe.ingredients[ingredient.id] || 0) * multiplier;
        return {
          ...ingredient,
          amount: Math.max(0, ingredient.amount - requiredAmount),
          lastUpdated: getToday()
        };
      })
    );
  };

  // Enhanced production handler with ingredient consumption
  const handleProduziert = (cookieId: number, neuerWert: number) => {
    const today = getToday();
    const cookie = cookies.find(c => c.id === cookieId);
    if (!cookie) return;

    const oldValue = cookie.history?.[today]?.produziert || 0;
    const diff = neuerWert - oldValue;

    // Only deduct ingredients if new production occurred
    if (diff > 0) {
      produziereCookie(cookieId, diff);
    }

    // Update daily production data
    const currentDayData = cookie.history[today] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0, produziert: 0 };
    updateCookieDay(cookieId, { 
      ...currentDayData, 
      produziert: neuerWert,
      new: neuerWert // Keep new in sync with produziert for backward compatibility
    });

    // Update cookie prepared count
    setCookies(prev =>
      prev.map(c =>
        c.id === cookieId
          ? { ...c, prepared: c.prepared + diff }
          : c
      )
    );
  };

  // Tageswerte aktualisieren - improved method
  const updateCookieDay = (cookieId: number, values: Partial<DailyData>, date?: string) => {
    const targetDate = date || getToday();
    setCookies(cookies =>
      cookies.map(cookie => {
        if (cookie.id !== cookieId) return cookie;
        const dayData = cookie.history[targetDate] || { sold: 0, prepared: 0, used: 0, trash: 0, new: 0, produziert: 0 };
        return {
          ...cookie,
          history: {
            ...cookie.history,
            [targetDate]: { ...dayData, ...values },
          },
        };
      })
    );
  };

  const updateDailyData = (cookieId: number, date: string, dailyData: DailyData) => {
    updateCookieDay(cookieId, dailyData, date);
  };

  // Cookie settings updaten (Namen, Preise)
  const updateCookieSettings = (newSettingsArr: Array<{name: string; productionPrice: number; salesPrice: number}>) => {
    setCookies(prev =>
      prev.map((cookie, idx) => ({
        ...cookie,
        name: newSettingsArr[idx]?.name || cookie.name,
        productionPrice: Number(newSettingsArr[idx]?.productionPrice) || cookie.productionPrice,
        price: Number(newSettingsArr[idx]?.salesPrice) || cookie.price,
      }))
    );
  };

  // Add new cookie
  const addCookie = (name: string) => {
    const newId = Math.max(...cookies.map(c => c.id)) + 1;
    const newCookie: CookieData = {
      id: newId,
      name,
      sold: 0,
      stock: 0,
      prepared: 0,
      price: 2.50,
      productionPrice: 0.70,
      category: "Classic",
      history: {}
    };
    setCookies(prev => [...prev, newCookie]);
    
    // Add default warn level for new cookie
    setWarnLevels(prev => ({
      ...prev,
      [name]: 10
    }));

    // Add default recipe for new cookie
    setRecipes(prev => [...prev, {
      cookieId: newId,
      ingredients: {},
      yield: 100,
      notes: ""
    }]);
  };

  // Delete cookie
  const deleteCookie = (index: number) => {
    const cookieToDelete = cookies[index];
    setCookies(prev => prev.filter((_, idx) => idx !== index));
    
    // Remove warn level for deleted cookie
    if (cookieToDelete) {
      setWarnLevels(prev => {
        const newWarnLevels = { ...prev };
        delete newWarnLevels[cookieToDelete.name];
        return newWarnLevels;
      });

      // Remove recipe for deleted cookie
      setRecipes(prev => prev.filter(recipe => recipe.cookieId !== cookieToDelete.id));
    }
  };

  // Kosten aus Settings ändern
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Website Settings updaten
  const updateWebsiteSettings = (newSettings: Partial<WebsiteSettings>) => {
    setWebsiteSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Update warn levels
  const updateWarnLevels = (newWarnLevels: WarnLevels) => {
    setWarnLevels(newWarnLevels);
  };

  // Update recipes
  const updateRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
  };

  // Enhanced production function with ingredient consumption
  const handleProduction = (cookieId: number, quantity: number) => {
    handleProduziert(cookieId, quantity);
  };

  // Logout function
  const logout = () => {
    setUser(null);
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cookie Business Dashboard</h2>
          <p className="text-gray-600">Initialisierung...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div style={{ 
      background: websiteSettings.backgroundColor, 
      color: websiteSettings.textColor,
      minHeight: "100vh" 
    }}>
      <Router>
        <Header websiteSettings={websiteSettings} user={user} logout={logout} />
        <Routes>
          <Route 
            path="/" 
            element={
              user.permissions.viewDashboard ? (
                <Dashboard 
                  cookies={cookies} 
                  updateCookies={updateCookies} 
                  user={user} 
                  logout={logout}
                  websiteSettings={websiteSettings}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung, das Dashboard anzuzeigen.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/cookie/:id" 
            element={
              user.permissions.viewCookies ? (
                <CookieDetail cookies={cookies} updateCookies={updateCookies} updateCookieDay={updateCookieDay} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung, Cookie-Details anzuzeigen.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/produktion/:id" 
            element={
              user.permissions.production ? (
                <Produktion 
                  cookies={cookies} 
                  updateCookies={updateCookies} 
                  updateCookieDay={updateCookieDay} 
                  settings={settings}
                  handleProduction={handleProduction}
                  ingredients={ingredients}
                  recipes={recipes}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Produktion.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/daily/:id" 
            element={
              user.permissions.dailyTracking ? (
                <DailyTracking cookies={cookies} updateDailyData={updateDailyData} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Tageserfassung.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/daily" 
            element={
              user.permissions.dailyTracking ? (
                <DailyTracking cookies={cookies} updateDailyData={updateDailyData} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Tageserfassung.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/tagesinfo" 
            element={
              user.permissions.viewTagesinfo ? (
                <TagesInfo cookies={cookies} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Tagesübersicht.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/stats" 
            element={
              user.permissions.viewStats ? (
                <Stats cookies={cookies} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für Statistiken.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/advanced-stats" 
            element={
              user.permissions.viewStats ? (
                <AdvancedStats cookies={cookies} ingredients={ingredients} recipes={recipes} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für erweiterte Statistiken.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/zutaten" 
            element={
              user.permissions.viewIngredients ? (
                <ZutatenInventar 
                  ingredients={ingredients} 
                  setIngredients={setIngredients}
                  user={user}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für das Zutateninventar.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/inventur" 
            element={
              user.permissions.performInventory ? (
                <InventurModus 
                  cookies={cookies} 
                  updateCookies={updateCookies}
                  user={user}
                  inventoryAudits={inventoryAudits}
                  setInventoryAudits={setInventoryAudits}
                  warnLevels={warnLevels}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Inventur.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/inventur-log" 
            element={
              user.permissions.viewInventoryLog ? (
                <InventurLog 
                  inventoryAudits={inventoryAudits}
                  cookies={cookies}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für das Inventurprotokoll.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/todos" 
            element={
              user.permissions.viewTodos ? (
                <ToDos user={user} />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für Aufgaben.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/rezepturen" 
            element={
              user.permissions.viewRecipes ? (
                <RezepturenSettings 
                  cookies={cookies} 
                  ingredients={ingredients}
                  user={user}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für Rezepturen.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/website-settings" 
            element={
              user.permissions.editSettings ? (
                <WebsiteSettings 
                  websiteSettings={websiteSettings}
                  updateWebsiteSettings={updateWebsiteSettings}
                  user={user}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für Website-Einstellungen.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/produktionsplanung" 
            element={
              user.permissions.viewProductionPlanning ? (
                <Produktionsplanung 
                  cookies={cookies}
                  user={user}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Produktionsplanung.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/einkaufsliste" 
            element={
              user.permissions.viewShoppingList ? (
                <Einkaufsliste 
                  ingredients={ingredients}
                  warnLevels={warnLevels}
                  user={user}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für die Einkaufsliste.</p>
                  </div>
                </div>
              )
            } 
          />
          <Route 
            path="/user-management" 
            element={<UserManagement currentUser={user} />} 
          />
          <Route
            path="/settings"
            element={
              user.permissions.viewSettings ? (
                <Settings
                  cookies={cookies}
                  updateCookieSettings={updateCookieSettings}
                  settings={settings}
                  updateSettings={updateSettings}
                  user={user}
                  addCookie={addCookie}
                  deleteCookie={deleteCookie}
                  websiteSettings={websiteSettings}
                  updateWebsiteSettings={updateWebsiteSettings}
                  warnLevels={warnLevels}
                  updateWarnLevels={updateWarnLevels}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
                    <p className="text-gray-600">Sie haben keine Berechtigung für Einstellungen.</p>
                  </div>
                </div>
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;