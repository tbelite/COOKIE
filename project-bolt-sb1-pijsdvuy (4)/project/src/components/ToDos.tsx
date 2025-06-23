import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, CheckCircle, Clock, Trash2, Edit3, Save, X } from 'lucide-react';
import { User } from '../data/users';

interface ToDo {
  id: number;
  text: string;
  date: string;
  info: string;
  done: boolean;
  createdAt: string;
}

interface ToDosProps {
  user: User;
}

// Helper functions for localStorage
const loadToDos = (): ToDo[] => {
  try {
    return JSON.parse(localStorage.getItem("cookieToDos") || "[]");
  } catch {
    return [];
  }
};

const saveToDos = (toDos: ToDo[]) => {
  localStorage.setItem("cookieToDos", JSON.stringify(toDos));
};

function ToDos({ user }: ToDosProps) {
  const navigate = useNavigate();
  const [toDos, setToDos] = useState<ToDo[]>(loadToDos());
  const [input, setInput] = useState("");
  const [info, setInfo] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editInfo, setEditInfo] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => { 
    saveToDos(toDos); 
  }, [toDos]);

  // Add new todo
  const handleAdd = () => {
    if (!input.trim()) return;
    const newToDo: ToDo = {
      id: Date.now(),
      text: input.trim(),
      date,
      info: info.trim(),
      done: false,
      createdAt: new Date().toISOString()
    };
    setToDos([...toDos, newToDo]);
    setInput("");
    setInfo("");
  };

  // Toggle done status
  const toggleDone = (id: number) => {
    setToDos(toDos =>
      toDos.map(td =>
        td.id === id ? { ...td, done: !td.done } : td
      )
    );
  };

  // Delete todo
  const deleteToDo = (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
      setToDos(toDos => toDos.filter(td => td.id !== id));
    }
  };

  // Start editing
  const startEdit = (todo: ToDo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditInfo(todo.info);
    setEditDate(todo.date);
  };

  // Save edit
  const saveEdit = () => {
    if (!editText.trim()) return;
    setToDos(toDos =>
      toDos.map(td =>
        td.id === editingId
          ? { ...td, text: editText.trim(), info: editInfo.trim(), date: editDate }
          : td
      )
    );
    setEditingId(null);
    setEditText("");
    setEditInfo("");
    setEditDate("");
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditInfo("");
    setEditDate("");
  };

  // Get priority based on date
  const getPriority = (todoDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (todoDate < today) return 'overdue';
    if (todoDate === today) return 'today';
    if (todoDate === tomorrowStr) return 'tomorrow';
    return 'future';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'border-red-200 bg-red-50';
      case 'today': return 'border-amber-200 bg-amber-50';
      case 'tomorrow': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'Überfällig';
      case 'today': return 'Heute';
      case 'tomorrow': return 'Morgen';
      default: return 'Geplant';
    }
  };

  // Sort todos: not done first, then by date, then by creation time
  const sortedToDos = [...toDos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const completedCount = toDos.filter(td => td.done).length;
  const pendingCount = toDos.filter(td => !td.done).length;
  const overdueCount = toDos.filter(td => !td.done && getPriority(td.date) === 'overdue').length;

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
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Team To-Do & Planung</h1>
                  <p className="text-sm sm:text-base text-gray-600">Aufgaben und Produktionsplanung</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{toDos.length}</p>
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

        {/* Add New Todo */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Neue Aufgabe hinzufügen</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Aufgabe/Planung (z.B. Chocolate Chip – 50 Stück backen)"
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={100}
                onKeyPress={e => e.key === 'Enter' && handleAdd()}
              />
              <input
                className="p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-40"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <textarea
              className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Zusätzliche Informationen oder Hinweise (optional)"
              rows={2}
              value={info}
              onChange={e => setInfo(e.target.value)}
              maxLength={200}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Aufgabe hinzufügen</span>
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3 sm:space-y-4">
          {toDos.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine Aufgaben geplant</h3>
              <p className="text-gray-500">Fügen Sie Ihre erste Aufgabe hinzu, um zu beginnen.</p>
            </div>
          )}

          {sortedToDos.map((todo) => {
            const priority = getPriority(todo.date);
            const isEditing = editingId === todo.id;
            
            return (
              <div
                key={todo.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${
                  todo.done 
                    ? 'opacity-60 border-gray-200' 
                    : getPriorityColor(priority)
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            maxLength={100}
                          />
                          <textarea
                            value={editInfo}
                            onChange={e => setEditInfo(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            rows={2}
                            maxLength={200}
                            placeholder="Zusätzliche Informationen"
                          />
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`text-base sm:text-lg font-semibold ${
                              todo.done ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {todo.text}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              priority === 'overdue' ? 'bg-red-100 text-red-800' :
                              priority === 'today' ? 'bg-amber-100 text-amber-800' :
                              priority === 'tomorrow' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getPriorityLabel(priority)}
                            </div>
                          </div>
                          {todo.info && (
                            <p className={`text-sm mb-3 ${
                              todo.done ? 'line-through text-gray-400' : 'text-gray-600'
                            }`}>
                              {todo.info}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Geplant für: <strong>{todo.date}</strong></span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Erstellt: {new Date(todo.createdAt).toLocaleDateString('de-DE')}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Save className="h-3 w-3" />
                            <span>Speichern</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            <X className="h-3 w-3" />
                            <span>Abbrechen</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleDone(todo.id)}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                              todo.done
                                ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>{todo.done ? "Offen" : "Erledigt"}</span>
                          </button>
                          <button
                            onClick={() => startEdit(todo)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteToDo(todo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ToDos;