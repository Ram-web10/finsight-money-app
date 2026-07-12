import { useState, useEffect } from 'react';
import { User, Globe, Check, Loader2, Mail, Lock, ChevronDown } from 'lucide-react';
import { currencies } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user, userSettings, updateUserSettings, updateUserPassword } = useAuth();
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState(userSettings?.currency || 'USD');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(userSettings?.full_name || '');
    setCurrency(userSettings?.currency || 'USD');
  }, [userSettings]);

  const handleSaveProfile = async () => {
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      await updateUserSettings({ full_name: fullName, currency });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    const { error } = await updateUserPassword(newPassword);
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const selectedCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Update your name and currency preference</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Currency</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold text-gray-900 dark:text-white w-8">{selectedCurrency.symbol}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedCurrency.code}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{selectedCurrency.name}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 transition-colors ${
                        currency === c.code ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className="text-lg font-semibold text-gray-900 dark:text-white w-8">{c.symbol}</span>
                      <div className="text-left flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{c.code}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{c.name}</p>
                      </div>
                      {currency === c.code && <Check className="w-5 h-5 text-primary-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              The currency symbol will update everywhere in the app
            </p>
          </div>

          {profileError && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg">
              <p className="text-sm text-danger-600">{profileError}</p>
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 bg-success-50 border border-success-100 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-success-600" />
              <p className="text-sm text-success-600">Settings saved successfully</p>
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-50">
              <Lock className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Update your account password</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {passwordError && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg">
              <p className="text-sm text-danger-600">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-success-50 border border-success-100 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-success-600" />
              <p className="text-sm text-success-600">Password updated successfully</p>
            </div>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-xl hover:from-warning-600 hover:to-warning-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
