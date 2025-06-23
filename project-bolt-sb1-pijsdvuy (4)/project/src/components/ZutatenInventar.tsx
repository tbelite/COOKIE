import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Minus, AlertTriangle, CheckCircle, Truck, Euro, Calendar, Search, Filter, Edit3, Trash2, Save, X } from 'lucide-react';
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

interface ZutatenInventarProps {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
  user: User;
}

function ZutatenInventar({ ingredients, setIngredients, user }: ZutatenInventarProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'critical'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    amount: '',
    unit: '',
    minStock: '',
    costPerUnit: '',
    supplier: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  const getStockStatus = (ingredient: Ingredient) => {
    const percentage = (ingredient.amount / ingredient.minStock) * 100;
    if (percentage <= 50) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    if (percentage <= 100) return { status: 'low', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'good', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStockStatus(ingredient).status;
    if (filterStatus === 'low') return matchesSearch && (status === 'low' || status === 'critical');
    if (filterStatus === 'critical') return matchesSearch && status === 'critical';
    
    return matchesSearch;
  });

  const updateAmount = (id: number, delta: number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id 
        ? { ...ing, amount: Math.max(0, ing.amount + delta), lastUpdated: new Date().toISOString().split('T')[0] }
        : ing
    ));
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.amount || !newIngredient.unit) return;
    
    const ingredient: Ingredient = {
      id: Math.max(...ingredients.map(i => i.id), 0) + 1,
      name: newIngredient.name,
      amount: Number(newIngredient.amount),
      unit: newIngredient.unit,
      minStock: Number(newIngredient.minStock) || 1,
      costPerUnit: Number(newIngredient.costPerUnit) || 0,
      supplier: newIngredient.supplier || 'Unbekannt',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setIngredients([...ingredients, ingredient]);
    setNewIngredient({ name: '', amount: '', unit: '', minStock: '', costPerUnit: '', supplier: '' });
    setShowAddForm(false);
  };

  const handleEditStart = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setEditForm(ingredient);
  };

  const handleEditSave = () => {
    if (!editForm.name || !editForm.amount || !editForm.unit) return;
    
    setIngredients(ingredients.map(ing => 
      ing.id === editingId 
        ? { ...ing, ...editForm, lastUpdated: new Date().toISOString().split('T')[0] }
        : ing
    ));
    setEditingId(null);
    setEditForm({});
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Zutat löschen möchten?')) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const getTotalValue = () => {
    return ingredients.reduce((total, ing) => total + (ing.amount * ing.costPerUnit), 0);
  };

  const getLowStockCount = () => {
    return ingredients.filter(ing => getStockStatus(ing).status !== 'good').length;
  };

  const getCriticalStockCount = () => {
    return ingredients.filter(ing => getStockStatus(ing).status === 'critical').length;
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
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Zutateninventar</h1>
                  <p className="text-sm sm:text-base text-gray-600">Lagerbestand und Lieferantenverwaltung</p>
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
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Zutaten Gesamt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{ingredients.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamtwert</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">€{getTotalValue().toFixed(2)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <Euro className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Niedrige Bestände</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{getLowStockCount()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Kritische Bestände</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{getCriticalStockCount()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Zutat oder Lieferant suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">Alle Bestände</option>
                <option value="low">Niedrige Bestände</option>
                <option value="critical">Kritische Bestände</option>
              </select>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Zutat hinzufügen</span>
                <span className="sm:hidden">Hinzufügen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Add New Ingredient Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Neue Zutat hinzufügen</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="z.B. Mehl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menge *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newIngredient.amount}
                  onChange={(e) => setNewIngredient({...newIngredient, amount: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Einheit *</label>
                <input
                  type="text"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="kg, Liter, Stück"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestand</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newIngredient.minStock}
                  onChange={(e) => setNewIngredient({...newIngredient, minStock: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kosten pro Einheit (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newIngredient.costPerUnit}
                  onChange={(e) => setNewIngredient({...newIngredient, costPerUnit: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieferant</label>
                <input
                  type="text"
                  value={newIngredient.supplier}
                  onChange={(e) => setNewIngredient({...newIngredient, supplier: e.target.value})}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Lieferantenname"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddIngredient}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Hinzufügen</span>
              </button>
            </div>
          </div>
        )}

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredIngredients.map((ingredient) => {
            const status = getStockStatus(ingredient);
            const isEditing = editingId === ingredient.id;
            const totalValue = ingredient.amount * ingredient.costPerUnit;
            
            return (
              <div
                key={ingredient.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 ${status.border}`}
              >
                {/* Header */}
                <div className={`p-4 sm:p-6 ${status.bg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full text-lg font-bold bg-white border border-gray-200 rounded px-2 py-1"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{ingredient.name}</h3>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Truck className="h-4 w-4" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.supplier || ''}
                            onChange={(e) => setEditForm({...editForm, supplier: e.target.value})}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <span>{ingredient.supplier}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleEditStart(ingredient)}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit3 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(ingredient.id)}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {/* Stock Management */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Aktueller Bestand</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.status === 'critical' ? 'Kritisch' : status.status === 'low' ? 'Niedrig' : 'Gut'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={editForm.amount || ''}
                            onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                            className="w-20 p-2 border border-gray-200 rounded text-center"
                          />
                          <input
                            type="text"
                            value={editForm.unit || ''}
                            onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                            className="w-16 p-2 border border-gray-200 rounded text-center"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateAmount(ingredient.id, -0.5)}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <div className="text-center">
                              <span className="text-xl font-bold text-gray-900">{ingredient.amount}</span>
                              <span className="text-sm text-gray-600 ml-1">{ingredient.unit}</span>
                            </div>
                            <button
                              onClick={() => updateAmount(ingredient.id, 0.5)}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mindestbestand:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editForm.minStock || ''}
                          onChange={(e) => setEditForm({...editForm, minStock: Number(e.target.value)})}
                          className="w-20 p-1 border border-gray-200 rounded text-right text-sm"
                        />
                      ) : (
                        <span className="font-medium">{ingredient.minStock} {ingredient.unit}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kosten pro {ingredient.unit}:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.costPerUnit || ''}
                          onChange={(e) => setEditForm({...editForm, costPerUnit: Number(e.target.value)})}
                          className="w-20 p-1 border border-gray-200 rounded text-right text-sm"
                        />
                      ) : (
                        <span className="font-medium">€{ingredient.costPerUnit.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Gesamtwert:</span>
                      <span className="font-bold text-green-600">€{totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Letzte Aktualisierung:</span>
                      <span className="text-xs text-gray-500">{ingredient.lastUpdated}</span>
                    </div>
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                      >
                        <Save className="h-3 w-3" />
                        <span>Speichern</span>
                      </button>
                    </div>
                  )}

                  {/* Stock Progress Bar */}
                  {!isEditing && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Bestandslevel</span>
                        <span>{Math.round((ingredient.amount / ingredient.minStock) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            status.status === 'critical' ? 'bg-red-500' :
                            status.status === 'low' ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (ingredient.amount / ingredient.minStock) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredIngredients.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Zutaten gefunden</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Versuchen Sie einen anderen Suchbegriff oder Filter.'
                : 'Fügen Sie Ihre erste Zutat hinzu, um zu beginnen.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Erste Zutat hinzufügen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ZutatenInventar;