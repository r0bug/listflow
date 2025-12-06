import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Delete } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface PinPadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
  maxLength?: number;
}

const PinPad: React.FC<PinPadProps> = ({ pin, onPinChange, onSubmit, maxLength = 6 }) => {
  const handlePress = (value: string) => {
    if (value === 'clear') {
      onPinChange('');
    } else if (value === 'back') {
      onPinChange(pin.slice(0, -1));
    } else if (value === 'submit') {
      onSubmit();
    } else if (pin.length < maxLength) {
      const newPin = pin + value;
      onPinChange(newPin);
      if (newPin.length === maxLength) {
        setTimeout(onSubmit, 200);
      }
    }
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'submit'],
  ];

  return (
    <div className="space-y-4">
      {/* PIN Display */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-colors',
              i < pin.length
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300'
            )}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {buttons.flat().map((value) => (
          <button
            key={value}
            onClick={() => handlePress(value)}
            className={cn(
              'h-16 rounded-lg text-xl font-medium transition-colors',
              value === 'back'
                ? 'text-gray-500 hover:bg-gray-100'
                : value === 'submit'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {value === 'back' ? (
              <Delete size={24} className="mx-auto" />
            ) : value === 'submit' ? (
              '✓'
            ) : (
              value
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const PinLogin: React.FC = () => {
  const navigate = useNavigate();
  const { recentUsers, loginWithPin, login } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<typeof recentUsers[0] | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mock recent users if none exist
  const displayUsers = recentUsers.length > 0 ? recentUsers : [
    { id: 'user-bob-1', name: 'Bob', displayName: 'Bob', role: 'ADMIN' as const, email: 'bob@alpha.com', domainId: 'loc1', isActive: true, isPlatformAdmin: false, itemsListedToday: 23, itemsListedWeek: 89, itemsListedMonth: 342, itemsListedAllTime: 1247, permissions: {} },
    { id: 'user-alice-1', name: 'Alice', displayName: 'Alice', role: 'ADMIN' as const, email: 'alice@alpha.com', domainId: 'loc1', isActive: true, isPlatformAdmin: false, itemsListedToday: 15, itemsListedWeek: 127, itemsListedMonth: 450, itemsListedAllTime: 2341, permissions: {} },
    { id: 'user-carol-1', name: 'Carol', displayName: 'Carol', role: 'ADMIN' as const, email: 'carol@alpha.com', domainId: 'loc1', isActive: true, isPlatformAdmin: false, itemsListedToday: 0, itemsListedWeek: 67, itemsListedMonth: 280, itemsListedAllTime: 987, permissions: {} },
  ];

  const handlePinSubmit = async () => {
    if (!selectedUser || pin.length < 4) return;

    setIsLoading(true);
    setError('');

    try {
      await loginWithPin(selectedUser.id, pin);
      navigate('/');
    } catch (err) {
      setError('Invalid PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailLogin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setShowEmailLogin(false)}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Back to PIN login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-sm text-gray-500 mb-2">Listing Station 1</h1>
          <h2 className="text-2xl font-bold">
            {selectedUser ? `Enter PIN for ${selectedUser.displayName || selectedUser.name}` : "Who's working?"}
          </h2>
        </div>

        {!selectedUser ? (
          <>
            {/* User Selection */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {displayUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <User size={32} className="text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {user.displayName || user.name}
                  </span>
                  <span className="text-xs text-gray-500">{user.role}</span>
                </button>
              ))}
              <button
                onClick={() => setShowEmailLogin(true)}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <Plus size={32} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-500">Other User...</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* PIN Entry */}
            <PinPad
              pin={pin}
              onPinChange={setPin}
              onSubmit={handlePinSubmit}
            />

            {error && (
              <p className="text-red-600 text-sm text-center mt-4">{error}</p>
            )}

            <button
              onClick={() => {
                setSelectedUser(null);
                setPin('');
                setError('');
              }}
              className="w-full mt-6 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};
