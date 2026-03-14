import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Building,
  CreditCard,
  Bell,
  Palette,
  Shield,
  Database,
  Key,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus,
  Loader2,
  Package,
} from 'lucide-react';
import api from '../../api/client';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';

type SettingsTab = 'profile' | 'ebay' | 'listing' | 'ai' | 'notifications' | 'appearance' | 'security' | 'users';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const baseTabs: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'ebay', label: 'eBay Account', icon: <CreditCard size={20} /> },
  { id: 'listing', label: 'Listing Defaults', icon: <Package size={20} /> },
  { id: 'ai', label: 'AI Settings', icon: <Database size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
  { id: 'security', label: 'Security', icon: <Shield size={20} /> },
];

const adminTab: TabConfig = { id: 'users', label: 'User Management', icon: <Users size={20} /> };

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ebay');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  // User management state (admin only)
  const [userList, setUserList] = useState<{ id: string; email: string; name: string; role: string; lastActive?: string }[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', pin: '', role: 'USER' });
  const [userError, setUserError] = useState('');

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Security state
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [ebayForm, setEbayForm] = useState({
    clientId: '',
    clientSecret: '',
    devId: '',
    sandbox: false, // Production mode
    accountConnected: false,
  });

  const [ebayStatus, setEbayStatus] = useState<{
    configured: boolean;
    authenticated: boolean;
    sandbox: boolean;
    clientId: string | null;
    loading: boolean;
  }>({
    configured: false,
    authenticated: false,
    sandbox: false,
    clientId: null,
    loading: true,
  });

  // Check eBay connection status on mount
  useEffect(() => {
    const checkEbayStatus = async () => {
      try {
        const response = await fetch('/api/v1/ebay/status');
        const data = await response.json();
        if (data.success) {
          setEbayStatus({
            ...data.status,
            loading: false,
          });
          // Populate form with credentials from backend
          setEbayForm(prev => ({
            ...prev,
            clientId: data.status.clientId || '',
            clientSecret: data.status.clientSecret || '',
            devId: data.status.devId || '',
            sandbox: data.status.sandbox || false,
            accountConnected: data.status.authenticated || false,
          }));
        }
      } catch (err) {
        console.error('Failed to check eBay status:', err);
        setEbayStatus(prev => ({ ...prev, loading: false }));
      }
    };
    checkEbayStatus();
  }, []);

  const [aiForm, setAiForm] = useState({
    segmindApiKey: '',
    autoAnalyze: true,
    defaultModel: 'llava',
  });

  // Listing defaults state
  const [listingDefaults, setListingDefaults] = useState({
    listingFormat: 'FixedPrice',
    listingDuration: 'GTC',
    quantity: 1,
    shippingService: 'USPSPriority',
    shippingType: 'Flat',
    shippingCost: 0,
    handlingTime: 3,
    postalCode: '',
    bestOffer: false,
    returnPolicy: {
      returnsAccepted: 'true',
      returnDays: '30',
      refundType: 'MoneyBack',
      shippingCostPaidBy: 'Buyer',
    },
  });
  const [listingDefaultsLoaded, setListingDefaultsLoaded] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    itemSold: true,
    priceAlerts: false,
    dailyDigest: true,
  });

  // Load listing defaults when tab is activated
  useEffect(() => {
    if (activeTab === 'listing' && !listingDefaultsLoaded) {
      const loadDefaults = async () => {
        try {
          const result = await api.getListingDefaults();
          if (result.success && result.data) {
            const d = result.data as Record<string, unknown>;
            setListingDefaults(prev => ({
              ...prev,
              ...(d.listingFormat ? { listingFormat: d.listingFormat as string } : {}),
              ...(d.listingDuration ? { listingDuration: d.listingDuration as string } : {}),
              ...(d.quantity != null ? { quantity: d.quantity as number } : {}),
              ...(d.shippingService ? { shippingService: d.shippingService as string } : {}),
              ...(d.shippingType ? { shippingType: d.shippingType as string } : {}),
              ...(d.shippingCost != null ? { shippingCost: d.shippingCost as number } : {}),
              ...(d.handlingTime != null ? { handlingTime: d.handlingTime as number } : {}),
              ...(d.postalCode ? { postalCode: d.postalCode as string } : {}),
              ...(d.bestOffer != null ? { bestOffer: d.bestOffer as boolean } : {}),
              ...(d.returnPolicy ? { returnPolicy: d.returnPolicy as typeof prev.returnPolicy } : {}),
            }));
            setListingDefaultsLoaded(true);
          }
        } catch (err) {
          console.error('Failed to load listing defaults:', err);
        }
      };
      loadDefaults();
    }
  }, [activeTab, listingDefaultsLoaded]);

  const handleSave = async () => {
    setIsSaving(true);

    if (activeTab === 'listing') {
      try {
        const result = await api.saveListingDefaults(listingDefaults);
        if (result.success) {
          setSavedMessage('Listing defaults saved! New items will use these settings.');
        } else {
          setSavedMessage('Failed to save listing defaults');
        }
      } catch (err) {
        console.error('Failed to save listing defaults:', err);
        setSavedMessage('Failed to save listing defaults');
      }
    } else {
      // Simulate for other tabs
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedMessage('Settings saved successfully!');
    }

    setIsSaving(false);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleUpdatePin = async () => {
    setPinError('');
    setPinSuccess('');

    // Validation
    if (!pinForm.currentPin) {
      setPinError('Current PIN is required');
      return;
    }
    if (!pinForm.newPin) {
      setPinError('New PIN is required');
      return;
    }
    if (pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PIN and confirmation do not match');
      return;
    }

    // In real implementation, call API to update PIN
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPinSuccess('PIN updated successfully!');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setTimeout(() => setPinSuccess(''), 3000);
    } catch (error) {
      setPinError('Failed to update PIN. Please try again.');
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await api.getUsers();
      if (result.success) {
        setUserList(result.data as typeof userList);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setUsersLoading(false);
  };

  const handleCreateUser = async () => {
    setUserError('');
    if (!newUserForm.name || !newUserForm.email || !newUserForm.pin) {
      setUserError('Name, email, and PIN are required');
      return;
    }
    if (!/^\d{4}$/.test(newUserForm.pin)) {
      setUserError('PIN must be exactly 4 digits');
      return;
    }
    try {
      const result = await api.createUser(newUserForm);
      if (result.success) {
        setNewUserForm({ name: '', email: '', pin: '', role: 'USER' });
        setShowAddUserForm(false);
        loadUsers();
      }
    } catch (err: any) {
      setUserError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Load users when switching to the users tab
  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers();
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Location</h3>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Building size={24} className="text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{user?.domain?.name || 'No location assigned'}</p>
                  <p className="text-sm text-slate-500">{user?.domain?.code || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ebay':
        return (
          <div className="space-y-6">
            {/* Connection Status Banner */}
            {ebayStatus.loading ? (
              <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                <RefreshCw size={20} className="text-slate-400 animate-spin" />
                <span className="text-slate-600">Checking eBay connection...</span>
              </div>
            ) : ebayStatus.authenticated ? (
              <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                    <Check size={20} className="text-sage-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sage-700">Connected to eBay Production</p>
                    <p className="text-sm text-sage-600">
                      App ID: {ebayStatus.clientId} • Ready to list items
                    </p>
                  </div>
                </div>
              </div>
            ) : ebayStatus.configured ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700">Credentials configured, but not authenticated</p>
                    <p className="text-sm text-amber-600">Get a user token from the eBay Developer Portal</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Step 1: Developer Portal Credentials */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Step 1: Developer Portal Credentials</h3>
              <p className="text-sm text-slate-500 mb-4">
                Get these from{' '}
                <a href="https://developer.ebay.com/my/keys" target="_blank" rel="noopener noreferrer" className="text-ink-600 underline">
                  developer.ebay.com/my/keys
                </a>
              </p>
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">App ID (Client ID)</label>
                  <input
                    type="text"
                    value={ebayForm.clientId}
                    onChange={(e) => setEbayForm({ ...ebayForm, clientId: e.target.value })}
                    placeholder="e.g., YourApp-PRD-abc123-456def"
                    className="input bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cert ID (Client Secret)</label>
                  <input
                    type="password"
                    value={ebayForm.clientSecret}
                    onChange={(e) => setEbayForm({ ...ebayForm, clientSecret: e.target.value })}
                    placeholder="PRD-abc123456-7890-abcd-efgh"
                    className="input bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dev ID</label>
                  <input
                    type="text"
                    value={ebayForm.devId || ''}
                    onChange={(e) => setEbayForm({ ...ebayForm, devId: e.target.value })}
                    placeholder="12345678-90ab-cdef-1234-567890abcdef"
                    className="input bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Environment Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Environment</p>
                <p className="text-sm text-slate-500">
                  {ebayForm.sandbox ? 'Testing with sandbox (no real listings)' : 'Production (real eBay listings)'}
                </p>
              </div>
              <button
                onClick={() => setEbayForm({ ...ebayForm, sandbox: !ebayForm.sandbox })}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  ebayForm.sandbox ? 'bg-amber-500' : 'bg-sage-500'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    ebayForm.sandbox ? 'translate-x-1' : 'translate-x-7'
                  )}
                />
              </button>
            </div>

            {/* Step 2: Account Authorization */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Step 2: Connect Your eBay Account</h3>
              <p className="text-sm text-slate-500 mb-4">
                Authorize ListFlow to access your eBay seller account
              </p>

              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-slate-900">eBay Account</p>
                    <p className="text-sm text-slate-500">
                      {ebayForm.accountConnected ? 'Connected as seller123' : 'Not connected'}
                    </p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    ebayForm.accountConnected ? 'badge-sage' : 'bg-slate-100 text-slate-600'
                  )}>
                    {ebayForm.accountConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {!ebayForm.accountConnected ? (
                  <button
                    onClick={async () => {
                      if (!ebayForm.clientId || !ebayForm.clientSecret) return;

                      // Store credentials and sandbox preference for OAuth callback
                      localStorage.setItem('ebay_oauth_state', JSON.stringify({
                        clientId: ebayForm.clientId,
                        clientSecret: ebayForm.clientSecret,
                        sandbox: ebayForm.sandbox,
                      }));

                      // Call backend to initiate OAuth flow
                      try {
                        const response = await fetch('/api/v1/ebay/auth/url', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            clientId: ebayForm.clientId,
                            sandbox: ebayForm.sandbox,
                          }),
                        });
                        const data = await response.json();
                        if (data.authUrl) {
                          window.location.href = data.authUrl;
                        } else {
                          alert('Failed to get auth URL. Make sure the backend is configured.');
                        }
                      } catch (err) {
                        alert('Backend not configured for eBay OAuth. See console for details.');
                        console.error('eBay OAuth error:', err);
                      }
                    }}
                    disabled={!ebayForm.clientId || !ebayForm.clientSecret || !ebayForm.devId}
                    className="btn-primary w-full py-3"
                  >
                    Connect to {ebayForm.sandbox ? 'eBay Sandbox' : 'eBay Production'}
                  </button>
                ) : (
                  <button
                    onClick={() => setEbayForm({ ...ebayForm, accountConnected: false })}
                    className="w-full px-4 py-3 bg-coral-50 text-coral-600 rounded-lg font-medium hover:bg-coral-100"
                  >
                    Disconnect Account
                  </button>
                )}

                {(!ebayForm.clientId || !ebayForm.clientSecret || !ebayForm.devId) && (
                  <p className="mt-2 text-xs text-amber-600">
                    Enter all developer credentials above first (App ID, Cert ID, and Dev ID)
                  </p>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="p-4 bg-ink-50 border border-ink-200 rounded-lg">
              <h4 className="font-medium text-ink-900 mb-2">How eBay Authentication Works</h4>
              <ol className="text-sm text-ink-700 space-y-1 list-decimal list-inside">
                <li>Create an app at developer.ebay.com to get API credentials</li>
                <li>Enter the App ID, Cert ID, and Dev ID above</li>
                <li>Click "Connect eBay Account" to authorize with your seller account</li>
                <li>eBay will redirect you back after authorization</li>
              </ol>
            </div>
          </div>
        );

      case 'listing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Listing Defaults</h3>
              <p className="text-sm text-slate-500 mb-4">
                These defaults are applied to every new item created from the photo pool. You can override them on individual items.
              </p>
            </div>

            {/* Listing Format */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h4 className="font-medium text-slate-900">Listing Format</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <div className="flex gap-4">
                  {['FixedPrice', 'Auction', 'AuctionWithBIN'].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultListingFormat"
                        value={fmt}
                        checked={listingDefaults.listingFormat === fmt}
                        onChange={(e) => setListingDefaults({ ...listingDefaults, listingFormat: e.target.value })}
                        className="text-ink-600"
                      />
                      <span className="text-sm text-slate-700">{fmt === 'AuctionWithBIN' ? 'Auction + BIN' : fmt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <select
                    value={listingDefaults.listingDuration}
                    onChange={(e) => setListingDefaults({ ...listingDefaults, listingDuration: e.target.value })}
                    className="input w-full bg-white"
                  >
                    <option value="GTC">Good 'Til Cancelled</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="10">10 Days</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    value={listingDefaults.quantity}
                    onChange={(e) => setListingDefaults({ ...listingDefaults, quantity: parseInt(e.target.value) || 1 })}
                    className="input w-full bg-white"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Best Offer</p>
                  <p className="text-xs text-slate-500">Allow buyers to make offers</p>
                </div>
                <button
                  onClick={() => setListingDefaults({ ...listingDefaults, bestOffer: !listingDefaults.bestOffer })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    listingDefaults.bestOffer ? 'bg-ink-600' : 'bg-slate-200'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      listingDefaults.bestOffer ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Shipping */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h4 className="font-medium text-slate-900">Shipping</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="flex gap-4">
                  {['Flat', 'Calculated'].map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultShippingType"
                        value={t}
                        checked={listingDefaults.shippingType === t}
                        onChange={(e) => setListingDefaults({ ...listingDefaults, shippingType: e.target.value })}
                        className="text-ink-600"
                      />
                      <span className="text-sm text-slate-700">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                <select
                  value={listingDefaults.shippingService}
                  onChange={(e) => setListingDefaults({ ...listingDefaults, shippingService: e.target.value })}
                  className="input w-full bg-white"
                >
                  <option value="USPSPriority">USPS Priority Mail</option>
                  <option value="USPSFirstClass">USPS First Class</option>
                  <option value="USPSGround">USPS Ground Advantage</option>
                  <option value="FedExGround">FedEx Ground</option>
                  <option value="FedExHomeDelivery">FedEx Home Delivery</option>
                  <option value="UPSGround">UPS Ground</option>
                  <option value="UPS3Day">UPS 3 Day Select</option>
                </select>
              </div>
              {listingDefaults.shippingType === 'Flat' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Shipping Cost ($)</label>
                  <input
                    type="number"
                    value={listingDefaults.shippingCost || ''}
                    onChange={(e) => setListingDefaults({ ...listingDefaults, shippingCost: parseFloat(e.target.value) || 0 })}
                    className="input w-full bg-white"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Handling Time (business days)</label>
                <input
                  type="number"
                  value={listingDefaults.handlingTime}
                  onChange={(e) => setListingDefaults({ ...listingDefaults, handlingTime: parseInt(e.target.value) || 1 })}
                  className="input w-full bg-white"
                  min="0"
                  max="30"
                />
              </div>
            </div>

            {/* Returns */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h4 className="font-medium text-slate-900">Returns</h4>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Accept Returns:</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultReturnsAccepted"
                    checked={listingDefaults.returnPolicy.returnsAccepted !== 'false'}
                    onChange={() => setListingDefaults({
                      ...listingDefaults,
                      returnPolicy: { ...listingDefaults.returnPolicy, returnsAccepted: 'true' }
                    })}
                    className="text-ink-600"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultReturnsAccepted"
                    checked={listingDefaults.returnPolicy.returnsAccepted === 'false'}
                    onChange={() => setListingDefaults({
                      ...listingDefaults,
                      returnPolicy: { ...listingDefaults.returnPolicy, returnsAccepted: 'false' }
                    })}
                    className="text-ink-600"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
              {listingDefaults.returnPolicy.returnsAccepted !== 'false' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                    <select
                      value={listingDefaults.returnPolicy.returnDays}
                      onChange={(e) => setListingDefaults({
                        ...listingDefaults,
                        returnPolicy: { ...listingDefaults.returnPolicy, returnDays: e.target.value }
                      })}
                      className="input w-full bg-white"
                    >
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Refund</label>
                    <select
                      value={listingDefaults.returnPolicy.refundType}
                      onChange={(e) => setListingDefaults({
                        ...listingDefaults,
                        returnPolicy: { ...listingDefaults.returnPolicy, refundType: e.target.value }
                      })}
                      className="input w-full bg-white"
                    >
                      <option value="MoneyBack">Money Back</option>
                      <option value="Exchange">Exchange</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Return Shipping</label>
                    <select
                      value={listingDefaults.returnPolicy.shippingCostPaidBy}
                      onChange={(e) => setListingDefaults({
                        ...listingDefaults,
                        returnPolicy: { ...listingDefaults.returnPolicy, shippingCostPaidBy: e.target.value }
                      })}
                      className="input w-full bg-white"
                    >
                      <option value="Buyer">Buyer Pays</option>
                      <option value="Seller">Seller Pays</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h4 className="font-medium text-slate-900">Item Location</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={listingDefaults.postalCode}
                  onChange={(e) => setListingDefaults({ ...listingDefaults, postalCode: e.target.value })}
                  className="input w-full bg-white"
                  placeholder="e.g., 10001"
                  maxLength={10}
                />
                <p className="text-xs text-slate-500 mt-1">Used as item location on eBay and in CSV exports</p>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">AI Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Key size={16} className="inline mr-1" />
                    Segmind API Key
                  </label>
                  <input
                    type="password"
                    value={aiForm.segmindApiKey}
                    onChange={(e) => setAiForm({ ...aiForm, segmindApiKey: e.target.value })}
                    placeholder="Enter your Segmind API key"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Get your API key from{' '}
                    <a href="https://www.segmind.com" target="_blank" rel="noopener noreferrer" className="text-ink-600 underline">
                      segmind.com
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Model</label>
                  <select
                    value={aiForm.defaultModel}
                    onChange={(e) => setAiForm({ ...aiForm, defaultModel: e.target.value })}
                    className="input"
                  >
                    <option value="llava">LLaVA (Fast)</option>
                    <option value="claude">Claude (Accurate)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Auto-Analyze Photos</p>
                    <p className="text-sm text-slate-500">Automatically analyze photos on upload</p>
                  </div>
                  <button
                    onClick={() => setAiForm({ ...aiForm, autoAnalyze: !aiForm.autoAnalyze })}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      aiForm.autoAnalyze ? 'bg-ink-600' : 'bg-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        aiForm.autoAnalyze ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Notification Preferences</h3>
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'itemSold', label: 'Item Sold Alerts', desc: 'Get notified when an item sells' },
              { key: 'priceAlerts', label: 'Price Alerts', desc: 'Alerts when watched items change price' },
              { key: 'dailyDigest', label: 'Daily Digest', desc: 'Daily summary of activity' },
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{setting.label}</p>
                  <p className="text-sm text-slate-500">{setting.desc}</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    [setting.key]: !notificationSettings[setting.key as keyof typeof notificationSettings]
                  })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    notificationSettings[setting.key as keyof typeof notificationSettings] ? 'bg-ink-600' : 'bg-slate-200'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      notificationSettings[setting.key as keyof typeof notificationSettings] ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Appearance Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['light', 'dark', 'system'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => handleThemeChange(themeOption)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-center transition-colors',
                        theme === themeOption ? 'border-ink-500 bg-ink-50' : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full mx-auto mb-2',
                        themeOption === 'light' ? 'bg-white border border-slate-200' :
                        themeOption === 'dark' ? 'bg-slate-800' : 'bg-gradient-to-r from-white to-slate-800'
                      )} />
                      <span className="text-sm font-medium capitalize">{themeOption}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Default View</label>
                <select className="input">
                  <option>Dashboard</option>
                  <option>Queue</option>
                  <option>Import</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Change PIN</label>
                <input
                  type="password"
                  placeholder="Current PIN"
                  maxLength={4}
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                  className="input mb-2"
                />
                <input
                  type="password"
                  placeholder="New PIN"
                  maxLength={4}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                  className="input mb-2"
                />
                <input
                  type="password"
                  placeholder="Confirm New PIN"
                  maxLength={4}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  className="input"
                />
              </div>
              {pinError && (
                <div className="flex items-center gap-2 text-coral-600 text-sm">
                  <AlertCircle size={16} />
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="flex items-center gap-2 text-sage-600 text-sm">
                  <Check size={16} />
                  {pinSuccess}
                </div>
              )}
              <button
                onClick={handleUpdatePin}
                className="btn-primary"
              >
                Update PIN
              </button>
            </div>
            <div className="pt-6 border-t border-slate-200">
              <h4 className="font-medium text-slate-900 mb-4">Active Sessions</h4>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Current Session</p>
                    <p className="text-sm text-slate-500">Chrome on Linux</p>
                  </div>
                  <span className="badge-sage">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900">User Management</h3>
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add User
              </button>
            </div>

            {showAddUserForm && (
              <div className="card p-4 border border-ink-200 bg-ink-50 space-y-3">
                <h4 className="font-medium text-slate-900">New User</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="input"
                      placeholder="user@listflow.local"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PIN (4 digits)</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newUserForm.pin}
                      onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value })}
                      className="input"
                      placeholder="1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="input"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                {userError && (
                  <div className="flex items-center gap-2 text-coral-600 text-sm">
                    <AlertCircle size={16} />
                    {userError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleCreateUser} className="btn-primary text-sm">
                    Create User
                  </button>
                  <button
                    onClick={() => { setShowAddUserForm(false); setUserError(''); }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-ink-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {userList.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        u.role === 'ADMIN' ? 'badge-plum' : 'badge'
                      )}>
                        {u.role}
                      </span>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="text-slate-400 hover:text-coral-500 p-1 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account and preferences</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-ink-50 text-ink-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 card p-6">
            {renderContent()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
              {savedMessage && (
                <div className="flex items-center gap-2 text-sage-600">
                  <Check size={20} />
                  <span className="text-sm">{savedMessage}</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary ml-auto flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
