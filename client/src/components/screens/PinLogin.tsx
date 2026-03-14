import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Delete } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface PinPadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
  maxLength?: number;
}

const PinPad: React.FC<PinPadProps> = ({ pin, onPinChange, onSubmit, maxLength = 4 }) => {
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
    <div className="space-y-6">
      {/* PIN Display */}
      <div className="flex justify-center gap-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3.5 h-3.5 rounded-full transition-all duration-200',
              i < pin.length
                ? 'bg-ink-600 scale-110'
                : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
        {buttons.flat().map((value) => (
          <button
            key={value}
            onClick={() => handlePress(value)}
            className={cn(
              'h-14 rounded-xl text-lg font-medium transition-all duration-100 active:scale-95',
              value === 'back'
                ? 'text-slate-400 hover:bg-slate-100'
                : value === 'submit'
                  ? 'bg-ink-600 text-white hover:bg-ink-700 shadow-sm'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            )}
          >
            {value === 'back' ? (
              <Delete size={20} className="mx-auto" />
            ) : value === 'submit' ? (
              <span className="text-xl">&#10003;</span>
            ) : (
              value
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-amber-100 text-amber-700',
  USER: 'bg-ink-100 text-ink-700',
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

  const [fetchedUsers, setFetchedUsers] = useState<{ id: string; name: string; role: string; email: string }[]>([]);
  const [_usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/v1/auth/pin-users');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setFetchedUsers(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  const displayUsers = fetchedUsers.length > 0 ? fetchedUsers.map(u => ({
    id: u.id,
    name: u.name,
    displayName: u.name,
    role: u.role as any,
    email: u.email,
    domainId: '',
    isActive: true,
    isPlatformAdmin: false,
    itemsListedToday: 0,
    itemsListedWeek: 0,
    itemsListedMonth: 0,
    itemsListedAllTime: 0,
    permissions: {},
  })) : recentUsers;

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-8 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-ink-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">LF</span>
            </div>
            <h1 className="text-xl text-slate-900">Sign In</h1>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <p className="text-coral-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setShowEmailLogin(false)}
            className="w-full mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to PIN login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-ink-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">LF</span>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">Listing Station 1</p>
          <h1 className="text-xl text-slate-900">
            {selectedUser ? `Enter PIN` : "Who's working?"}
          </h1>
          {selectedUser && (
            <p className="text-sm text-slate-500 mt-1">{selectedUser.displayName || selectedUser.name}</p>
          )}
        </div>

        {!selectedUser ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {displayUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="flex flex-col items-center p-4 rounded-xl border border-slate-200 hover:border-ink-300 hover:bg-ink-50/50 transition-all duration-150 group"
                >
                  <div className="w-14 h-14 bg-slate-100 group-hover:bg-ink-100 rounded-full flex items-center justify-center mb-2.5 transition-colors">
                    <span className="text-lg font-semibold text-slate-600 group-hover:text-ink-600 transition-colors">
                      {(user.displayName || user.name).charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium text-sm text-slate-800">
                    {user.displayName || user.name}
                  </span>
                  <span className={cn('text-xs mt-1 px-2 py-0.5 rounded-full font-medium', roleColors[user.role] || 'bg-slate-100 text-slate-600')}>
                    {user.role}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowEmailLogin(true)}
                className="flex flex-col items-center p-4 rounded-xl border border-dashed border-slate-200 hover:border-slate-400 transition-colors"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-2.5">
                  <Plus size={24} className="text-slate-300" />
                </div>
                <span className="text-xs text-slate-400">Other</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <PinPad
              pin={pin}
              onPinChange={setPin}
              onSubmit={handlePinSubmit}
            />

            {error && (
              <p className="text-coral-600 text-sm text-center mt-4">{error}</p>
            )}

            <button
              onClick={() => {
                setSelectedUser(null);
                setPin('');
                setError('');
              }}
              className="w-full mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};
