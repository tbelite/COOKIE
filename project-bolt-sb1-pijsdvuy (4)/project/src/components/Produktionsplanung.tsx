import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, Trash2, Plus, Download } from 'lucide-react';
import { User } from '../data/users';
import { exportProdPlansToCSV } from '../utils';

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

interface ProductionPlan {
  id: number;
  cookie: string;
  menge: number;
  deadline: string;
  note: string;
  done: boolean;
  createdAt: string;
}

interface ProduktionsplanungProps {
  cookies: CookieData[];
  user: User;
}

const loadPlans = (): ProductionPlan[] => {
  try {
    return JSON.parse(localStorage.getItem("cookieProdPlans") || "[]");
  } catch {
    return [];
  }
};

const savePlans = (arr: ProductionPlan[]) => {
  localStorage.setItem("cookieProdPlans", JSON.stringify(arr));
};

export default function Produktionsplanung({ cookies, user }: ProduktionsplanungProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ProductionPlan[]>(loadPlans());
  const [cookieIdx, setCookieIdx] = useState(0);
  const [menge, setMenge] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); 
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");

  useEffect(() => { 
    savePlans(plans); 
  }, [plans]);

  const addPlan = () => {
    if (!menge || !cookies[cookieIdx]) return;
    const newPlan: ProductionPlan = {
      id: Date.now(),
      cookie: cookies[cookieIdx].name,
      menge: Number(menge),
      deadline,
      note,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setPlans([...plans, newPlan]);
    setMenge(""); 
    setNote("");
  };

  const toggleDone = (id: number) => {
    setPlans(plans => plans.map(p => p.id === id ? { ...p, done: !p.done } : p));
  };

  const removePlan = (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Produktionsplan löschen möchten?')) {
      setPlans(plans => plans.filter(p => p.id !== id));
    }
  };

  const getPriorityColor = (deadline: string, done: boolean) => {
    if (done) return "bg-green-50 border-green-200";
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (deadline < today) return "bg-red-50 border-red-200";
    if (deadline === today) return "bg-amber-50 border-amber-200";
    if (deadline === tomorrowStr) return "bg-blue-50 border-blue-200";
    return "bg-gray-50 border-gray-200";
  };

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const completedCount = plans.filter(p => p.done).length;
  const pendingCount = plans.filter(p => !p.done).length;
  const overdueCount = plans.filter(p => !p.done && p.deadline < new Date().toISOString().split('T')[0]).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Produktionsplanung</h1>
                  <p className="text-sm sm:text-base text-gray-600">Cookie-Produktionsaufträge verwalten</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {plans.length > 0 && (
                <button
                  onClick={() => exportProdPlansToCSV(plans)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Angemeldet als</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-amber-600 uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{plans.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Offen</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Erledigt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Überfällig</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{overdueCount}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Add New Plan */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Neuen Produktionsauftrag hinzufügen</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                className="p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                value={cookieIdx} 
                onChange={e => setCookieIdx(Number(e.target.value))}
              >
                {cookies.map((c, i) => (
                  <option key={i} value={i}>{c.name}</option>
                ))}
              </select>
              <input 
                className="p-2 sm:p-3 border border-gray-200 rounded-lg w-full sm:w-32 focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                type="number" 
                placeholder="Menge" 
                min={1}
                value={menge} 
                onChange={e => setMenge(e.target.value)} 
              />
              <input 
                className="p-2 sm:p-3 border border-gray-200 rounded-lg w-full sm:w-40 focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                type="date" 
                value={deadline}
                onChange={e => setDeadline(e.target.value)} 
              />
            </div>
            <textarea 
              className="p-2 sm:p-3 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
              rows={2}
              placeholder="Notiz (optional)" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
            <button 
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-semibold"
              onClick={addPlan}
              disabled={!menge}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Auftrag hinzufügen</span>
            </button>
          </div>
        </div>

        {/* Plans List */}
        <div className="space-y-3 sm:space-y-4">
          {plans.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Produktionsaufträge geplant</h3>
              <p className="text-gray-500">Fügen Sie Ihren ersten Produktionsauftrag hinzu.</p>
            </div>
          )}

          {sortedPlans.map(plan => (
            <div key={plan.id} className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 ${getPriorityColor(plan.deadline, plan.done)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${plan.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {plan.menge}x {plan.cookie}
                  </div>
                  {plan.note && (
                    <div className={`text-sm mt-1 ${plan.done ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      {plan.note}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Deadline: <strong>{plan.deadline}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Erstellt: {new Date(plan.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      plan.done
                        ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    onClick={() => toggleDone(plan.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>{plan.done ? "Offen" : "Erledigt"}</span>
                  </button>
                  <button 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => removePlan(plan.id)}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}