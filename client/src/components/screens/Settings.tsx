import React, { useState, useEffect } from 'react';
import {
  User,
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
  Users,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';

type SettingsTab = 'profile' | 'ebay' | 'agents' | 'ai' | 'notifications' | 'appearance' | 'security';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  { id: 'ebay', label: 'eBay Account', icon: <CreditCard size={20} /> },
  { id: 'agents', label: 'Listing Agents', icon: <Users size={20} /> },
  { id: 'ai', label: 'AI Settings', icon: <Database size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
  { id: 'security', label: 'Security', icon: <Shield size={20} /> },
];

type AgentRateType = 'PERCENT' | 'FLAT';

interface ListingAgent {
  id: string;
  name: string;
  active: boolean;
  rateType: AgentRateType;
  rateValue: number;
  source?: string;
}

interface AgentSyncResult {
  created: number;
  updated: number;
  deactivated: number;
}

const formatAgentRate = (rateType: AgentRateType, rateValue: number): string =>
  rateType === 'PERCENT' ? `${rateValue}%` : `$${Number(rateValue).toFixed(2)} flat`;

interface SellerAccount {
  id: string;
  accountName: string;
  email: string;
  sandbox: boolean;
  isActive: boolean;
  connected: boolean;
  lastSync: string | null;
  ordersSyncedThrough: string | null;
}

// Per-seller-account OAuth connect cards (two accounts share one dev app;
// each needs its own user-token consent, keyed through OAuth state)
const SellerAccountsSection: React.FC = () => {
  const [accounts, setAccounts] = useState<SellerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/v1/ebay/accounts');
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        }
      } catch {
        // section is non-critical; leave list empty
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const connect = async (account: SellerAccount) => {
    setConnecting(account.id);
    setError(null);
    try {
      const response = await fetch('/api/v1/ebay/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebayAccountId: account.id }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Could not build auth URL');
      localStorage.setItem(
        'ebay_oauth_state',
        JSON.stringify({ sandbox: account.sandbox, ebayAccountId: account.id })
      );
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err?.message || 'Failed to start eBay connection');
      setConnecting(null);
    }
  };

  if (loading) return null;
  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-slate-700">Seller Accounts</h3>
      {error && (
        <div className="p-3 bg-coral-50 border border-coral-200 rounded-lg text-sm text-coral-700">
          {error}
        </div>
      )}
      {accounts.map((account) => (
        <div
          key={account.id}
          className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-medium text-slate-800">
              {account.accountName}
              {account.sandbox && (
                <span className="ml-2 text-xs text-amber-600">sandbox</span>
              )}
            </p>
            <p className="text-sm text-slate-500">
              {account.connected
                ? `Connected • synced through ${
                    account.ordersSyncedThrough
                      ? new Date(account.ordersSyncedThrough).toLocaleDateString()
                      : 'never'
                  }`
                : 'Not connected — sales sync inactive'}
            </p>
          </div>
          <button
            onClick={() => connect(account)}
            disabled={connecting === account.id}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              account.connected
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-ink-600 text-white hover:bg-ink-700'
            )}
          >
            {connecting === account.id
              ? 'Redirecting…'
              : account.connected
                ? 'Reconnect'
                : 'Connect eBay'}
          </button>
        </div>
      ))}
    </div>
  );
};

const ListingAgentsSettings: React.FC = () => {
  const [agents, setAgents] = useState<ListingAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline rate editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRateType, setEditRateType] = useState<AgentRateType>('PERCENT');
  const [editRateValue, setEditRateValue] = useState('');
  const [isSavingRate, setIsSavingRate] = useState(false);

  // Add agent form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRateType, setAddRateType] = useState<AgentRateType>('PERCENT');
  const [addRateValue, setAddRateValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<AgentSyncResult | null>(null);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/agents?includeInactive=true');
      const data = await response.json();
      if (Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to load agents');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const patchAgent = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/v1/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error('Failed to update agent');
    }
  };

  const handleToggleActive = async (agent: ListingAgent) => {
    setError('');
    // Optimistic update
    setAgents(prev => prev.map(a => (a.id === agent.id ? { ...a, active: !a.active } : a)));
    try {
      await patchAgent(agent.id, { active: !agent.active });
    } catch (err) {
      console.error('Failed to toggle agent:', err);
      setError('Failed to update agent');
      await loadAgents();
    }
  };

  const startEditRate = (agent: ListingAgent) => {
    setEditingId(agent.id);
    setEditRateType(agent.rateType);
    setEditRateValue(String(agent.rateValue));
  };

  const handleSaveRate = async () => {
    if (!editingId || editRateValue === '') return;
    setIsSavingRate(true);
    setError('');
    try {
      await patchAgent(editingId, {
        rateType: editRateType,
        rateValue: parseFloat(editRateValue),
      });
      setEditingId(null);
      await loadAgents();
    } catch (err) {
      console.error('Failed to save rate:', err);
      setError('Failed to save rate');
    }
    setIsSavingRate(false);
  };

  const handleAddAgent = async () => {
    if (!addName.trim() || addRateValue === '') return;
    setIsAdding(true);
    setError('');
    try {
      const response = await fetch('/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          rateType: addRateType,
          rateValue: parseFloat(addRateValue),
        }),
      });
      if (response.ok) {
        setAddName('');
        setAddRateValue('');
        setShowAddForm(false);
        await loadAgents();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || data.message || 'Failed to add agent');
      }
    } catch (err) {
      console.error('Failed to add agent:', err);
      setError('Failed to add agent');
    }
    setIsAdding(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const response = await fetch('/api/v1/agents/sync', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setSyncResult({
          created: data.created ?? 0,
          updated: data.updated ?? 0,
          deactivated: data.deactivated ?? 0,
        });
        await loadAgents();
      } else {
        setError(data.error || data.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Failed to sync agents:', err);
      setError('Sync failed');
    }
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Listing Agents</h3>
          <p className="text-sm text-slate-500">Manage agents and their commission rates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            Sync from TeamTime
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add agent
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-sage-50 border border-sage-200 rounded-lg text-sm text-sage-700">
          Sync complete: {syncResult.created} created, {syncResult.updated} updated,{' '}
          {syncResult.deactivated} deactivated
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-coral-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Agent name"
                className="input w-full bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate Type</label>
              <select
                value={addRateType}
                onChange={(e) => setAddRateType(e.target.value as AgentRateType)}
                className="input w-auto bg-white"
              >
                <option value="PERCENT">Percent</option>
                <option value="FLAT">Flat ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate</label>
              <input
                type="number"
                value={addRateValue}
                onChange={(e) => setAddRateValue(e.target.value)}
                placeholder={addRateType === 'PERCENT' ? 'e.g. 10' : 'e.g. 5.00'}
                className="input w-28 bg-white"
                min="0"
                step="0.01"
              />
            </div>
            <button
              onClick={handleAddAgent}
              disabled={isAdding || !addName.trim() || addRateValue === ''}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isAdding && <Loader2 size={16} className="animate-spin" />}
              Add
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-ink-600" />
        </div>
      ) : agents.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">No agents yet. Add one or sync from TeamTime.</p>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                agent.active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-ink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-ink-600 font-medium text-sm">{agent.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.source || 'Manual'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {editingId === agent.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editRateType}
                      onChange={(e) => setEditRateType(e.target.value as AgentRateType)}
                      className="input w-auto text-sm py-1"
                    >
                      <option value="PERCENT">Percent</option>
                      <option value="FLAT">Flat ($)</option>
                    </select>
                    <input
                      type="number"
                      value={editRateValue}
                      onChange={(e) => setEditRateValue(e.target.value)}
                      className="input w-20 text-sm py-1"
                      min="0"
                      step="0.01"
                    />
                    <button
                      onClick={handleSaveRate}
                      disabled={isSavingRate || editRateValue === ''}
                      className="px-2 py-1 text-sm text-ink-600 hover:bg-ink-50 rounded-lg font-medium disabled:opacity-50"
                    >
                      {isSavingRate ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-sm text-slate-500 hover:bg-slate-50 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditRate(agent)}
                    className="text-sm text-slate-600 hover:text-ink-600 hover:bg-ink-50 px-2 py-1 rounded-lg"
                    title="Edit rate"
                  >
                    {formatAgentRate(agent.rateType, agent.rateValue)}
                  </button>
                )}

                <button
                  onClick={() => handleToggleActive(agent)}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    agent.active ? 'bg-sage-500' : 'bg-slate-200'
                  )}
                  title={agent.active ? 'Deactivate' : 'Activate'}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      agent.active ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ebay');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

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

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    itemSold: true,
    priceAlerts: false,
    dailyDigest: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSavedMessage('Settings saved successfully!');
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
            <SellerAccountsSection />
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

      case 'agents':
        return <ListingAgentsSettings />;

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
