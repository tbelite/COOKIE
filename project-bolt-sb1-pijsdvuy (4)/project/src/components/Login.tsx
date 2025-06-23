import React, { useState } from 'react';
import { Lock, Cookie, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { authenticateUser, User } from '../data/users';

interface LoginProps {
  setUser: (user: User) => void;
}

function Login({ setUser }: LoginProps) {
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = authenticateUser(loginCode);
    if (user) {
      setUser(user);
    } else {
      setError(true);
      setLoginCode('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 sm:p-3 bg-amber-100 rounded-xl">
            <Cookie className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Cookie Business</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">Professionelles Dashboard für Ihr Cookie-Geschäft</p>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="p-2 sm:p-3 bg-gray-100 rounded-full inline-block mb-4">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Anmeldung</h2>
          <p className="text-sm sm:text-base text-gray-600">Geben Sie Ihren Login-Code ein</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Login-Code
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type={showCode ? "text" : "password"}
                value={loginCode}
                onChange={(e) => {
                  setLoginCode(e.target.value);
                  setError(false);
                }}
                placeholder="Login-Code eingeben"
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center font-mono text-lg tracking-wider"
                required
                maxLength={10}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCode ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
              <div className="text-center text-red-700 font-medium text-sm">
                Ungültiger Login-Code oder Benutzer ist deaktiviert.
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base sm:text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Anmelden
          </button>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Demo-Zugang:</h3>
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">12345</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Administrator-Zugang</p>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
        <p>© 2025 Cookie Business Dashboard</p>
        <p>Sicher • Professionell • Benutzerfreundlich</p>
      </div>
    </div>
  );
}

export default Login;