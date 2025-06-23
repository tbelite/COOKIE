import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Edit3, Trash2, Save, X, Eye, EyeOff, Shield, UserCheck, UserX, Calendar, Clock } from 'lucide-react';
import { User, UserPermissions, loadUsers, saveUsers, createUser, updateUser, deleteUser, adminPermissions, employeePermissions } from '../data/users';

interface UserManagementProps {
  currentUser: User;
}

function UserManagement({ currentUser }: UserManagementProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'mitarbeiter' as 'admin' | 'mitarbeiter',
    permissions: employeePermissions,
    isActive: true
  });

  // Edit user form state
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  // Check if current user has permission to manage users
  if (!currentUser.permissions.manageUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 text-center max-w-sm sm:max-w-md">
          <div className="p-2 sm:p-3 bg-red-100 rounded-full inline-block mb-4">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Sie haben keine Berechtigung zur Benutzerverwaltung.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base"
          >
            Zurück zu den Einstellungen
          </button>
        </div>
      </div>
    );
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    
    try {
      const user = createUser({
        ...newUser,
        permissions: newUser.role === 'admin' ? adminPermissions : newUser.permissions
      });
      
      setUsers(loadUsers());
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'mitarbeiter',
        permissions: employeePermissions,
        isActive: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm(user);
  };

  const handleSaveEdit = () => {
    if (!editingUser || !editForm.name || !editForm.email) return;
    
    try {
      updateUser(editingUser.id, editForm);
      setUsers(loadUsers());
      setEditingUser(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === currentUser.id) {
      alert('Sie können sich nicht selbst löschen.');
      return;
    }
    
    if (window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      deleteUser(userId);
      setUsers(loadUsers());
    }
  };

  const toggleUserStatus = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUser(userId, { isActive: !user.isActive });
      setUsers(loadUsers());
    }
  };

  const updatePermission = (permission: keyof UserPermissions, value: boolean) => {
    if (newUser.role === 'admin') return; // Admin permissions are fixed
    
    setNewUser({
      ...newUser,
      permissions: {
        ...newUser.permissions,
        [permission]: value
      }
    });
  };

  const updateEditPermission = (permission: keyof UserPermissions, value: boolean) => {
    if (!editForm.permissions || editForm.role === 'admin') return;
    
    setEditForm({
      ...editForm,
      permissions: {
        ...editForm.permissions,
        [permission]: value
      }
    });
  };

  const permissionGroups = [
    {
      title: 'Dashboard & Übersicht',
      permissions: [
        { key: 'viewDashboard', label: 'Dashboard anzeigen' },
        { key: 'viewStats', label: 'Statistiken anzeigen' },
        { key: 'viewTagesinfo', label: 'Tagesübersicht anzeigen' }
      ]
    },
    {
      title: 'Cookie-Verwaltung',
      permissions: [
        { key: 'viewCookies', label: 'Cookies anzeigen' },
        { key: 'editCookies', label: 'Cookies bearbeiten' },
        { key: 'addCookies', label: 'Cookies hinzufügen' },
        { key: 'deleteCookies', label: 'Cookies löschen' }
      ]
    },
    {
      title: 'Tägliche Operationen',
      permissions: [
        { key: 'dailyTracking', label: 'Tageserfassung' },
        { key: 'production', label: 'Produktion' }
      ]
    },
    {
      title: 'Inventar & Lager',
      permissions: [
        { key: 'viewInventory', label: 'Inventar anzeigen' },
        { key: 'editInventory', label: 'Inventar bearbeiten' },
        { key: 'performInventory', label: 'Inventur durchführen' },
        { key: 'viewInventoryLog', label: 'Inventurprotokoll anzeigen' }
      ]
    },
    {
      title: 'Zutaten',
      permissions: [
        { key: 'viewIngredients', label: 'Zutaten anzeigen' },
        { key: 'editIngredients', label: 'Zutaten bearbeiten' },
        { key: 'addIngredients', label: 'Zutaten hinzufügen' },
        { key: 'deleteIngredients', label: 'Zutaten löschen' }
      ]
    },
    {
      title: 'Planung & Aufgaben',
      permissions: [
        { key: 'viewTodos', label: 'Aufgaben anzeigen' },
        { key: 'editTodos', label: 'Aufgaben bearbeiten' },
        { key: 'viewProductionPlanning', label: 'Produktionsplanung anzeigen' },
        { key: 'editProductionPlanning', label: 'Produktionsplanung bearbeiten' }
      ]
    },
    {
      title: 'Rezepte & Einstellungen',
      permissions: [
        { key: 'viewRecipes', label: 'Rezepte anzeigen' },
        { key: 'editRecipes', label: 'Rezepte bearbeiten' },
        { key: 'viewSettings', label: 'Einstellungen anzeigen' },
        { key: 'editSettings', label: 'Einstellungen bearbeiten' }
      ]
    },
    {
      title: 'Daten & Berichte',
      permissions: [
        { key: 'exportData', label: 'Daten exportieren' },
        { key: 'viewReports', label: 'Berichte anzeigen' },
        { key: 'viewShoppingList', label: 'Einkaufsliste anzeigen' },
        { key: 'editShoppingList', label: 'Einkaufsliste bearbeiten' }
      ]
    }
  ];

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
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
                  <p className="text-sm sm:text-base text-gray-600">Benutzer und Berechtigungen verwalten</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Angemeldet als</p>
              <p className="font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-amber-600 uppercase">{currentUser.role}</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Benutzer Gesamt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Aktive Benutzer</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.filter(u => u.isActive).length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Administratoren</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Mitarbeiter</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'mitarbeiter').length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Add User Button */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-semibold"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Neuen Benutzer hinzufügen</span>
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Neuen Benutzer hinzufügen</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Grundinformationen</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Vollständiger Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="benutzer@cookie.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Login-Code *</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                    placeholder="z.B. 67890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rolle *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const role = e.target.value as 'admin' | 'mitarbeiter';
                      setNewUser({
                        ...newUser, 
                        role,
                        permissions: role === 'admin' ? adminPermissions : employeePermissions
                      });
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="mitarbeiter">Mitarbeiter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Berechtigungen 
                  {newUser.role === 'admin' && <span className="text-sm text-gray-500 ml-2">(Alle Rechte)</span>}
                </h4>
                
                {newUser.role === 'mitarbeiter' ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {permissionGroups.map(group => (
                      <div key={group.title} className="border border-gray-200 rounded-lg p-3">
                        <h5 className="font-medium text-gray-800 mb-2 text-sm">{group.title}</h5>
                        <div className="space-y-2">
                          {group.permissions.map(perm => (
                            <label key={perm.key} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={newUser.permissions[perm.key as keyof UserPermissions]}
                                onChange={(e) => updatePermission(perm.key as keyof UserPermissions, e.target.checked)}
                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      Administratoren haben automatisch alle Berechtigungen.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email || !newUser.password}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Benutzer erstellen</span>
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Alle Benutzer</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Benutzer</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Rolle</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Login-Code</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Letzter Login</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={user.id === currentUser.id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${user.id === currentUser.id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Inaktiv
                          </>
                        )}
                      </button>
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`font-mono text-sm ${showPassword[user.id] ? 'text-gray-900' : 'text-gray-400'}`}>
                          {showPassword[user.id] ? user.password : '•'.repeat(user.password.length)}
                        </span>
                        <button
                          onClick={() => setShowPassword({...showPassword, [user.id]: !showPassword[user.id]})}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {showPassword[user.id] ? 
                            <EyeOff className="h-3 w-3 text-gray-500" /> : 
                            <Eye className="h-3 w-3 text-gray-500" />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="text-xs text-gray-500">
                        {user.lastLogin ? (
                          <>
                            <div>{new Date(user.lastLogin).toLocaleDateString('de-DE')}</div>
                            <div>{new Date(user.lastLogin).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : (
                          'Noch nie'
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit3 className="h-4 w-4 text-blue-600" />
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Benutzer bearbeiten</h3>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Grundinformationen</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login-Code</label>
                      <input
                        type="text"
                        value={editForm.password || ''}
                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                      <select
                        value={editForm.role || 'mitarbeiter'}
                        onChange={(e) => {
                          const role = e.target.value as 'admin' | 'mitarbeiter';
                          setEditForm({
                            ...editForm, 
                            role,
                            permissions: role === 'admin' ? adminPermissions : (editForm.permissions || employeePermissions)
                          });
                        }}
                        disabled={editingUser.id === currentUser.id}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="mitarbeiter">Mitarbeiter</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">
                      Berechtigungen
                      {editForm.role === 'admin' && <span className="text-sm text-gray-500 ml-2">(Alle Rechte)</span>}
                    </h4>
                    
                    {editForm.role === 'mitarbeiter' && editForm.permissions ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {permissionGroups.map(group => (
                          <div key={group.title} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-800 mb-2 text-sm">{group.title}</h5>
                            <div className="space-y-2">
                              {group.permissions.map(perm => (
                                <label key={perm.key} className="flex items-center space-x-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={editForm.permissions![perm.key as keyof UserPermissions]}
                                    onChange={(e) => updateEditPermission(perm.key as keyof UserPermissions, e.target.checked)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="text-gray-700">{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-800">
                          Administratoren haben automatisch alle Berechtigungen.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Änderungen speichern</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;