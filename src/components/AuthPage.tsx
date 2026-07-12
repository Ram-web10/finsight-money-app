import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot-password' | 'reset-sent' | 'reset-password';

export function AuthPage() {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, updateUserPassword } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setView('reset-password');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const result = await signIn(email, password);
    if (result.error) { setError(result.error.message); }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const result = await signUp(email, password);
    if (result.error) { setError(result.error.message); }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await resetPassword(email);
    if (result.error) { setError(result.error.message); } else { setView('reset-sent'); }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const result = await updateUserPassword(newPassword);
    if (result.error) { setError(result.error.message); } else { setView('signin'); setEmail(''); setPassword(''); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personal Finance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your personal financial insights</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 dark:bg-gray-800">
          {view === 'signin' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Welcome Back</h2>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Remember me</span></label>
                  <button type="button" onClick={() => { setView('forgot-password'); setError(null); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Forgot password?</button>
                </div>
                {error && <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg"><p className="text-sm text-danger-600">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-6 text-center"><p className="text-sm text-gray-500 dark:text-gray-400">Don't have an account? <button onClick={() => { setView('signup'); setError(null); setPassword(''); }} className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Sign Up</button></p></div>
            </>
          )}

          {view === 'signup' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Create Account</h2>
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                {error && <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg"><p className="text-sm text-danger-600">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-6 text-center"><p className="text-sm text-gray-500 dark:text-gray-400">Already have an account? <button onClick={() => { setView('signin'); setError(null); setPassword(''); setConfirmPassword(''); }} className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Sign In</button></p></div>
            </>
          )}

          {view === 'forgot-password' && (
            <>
              <button onClick={() => { setView('signin'); setError(null); }} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" />Back to Sign In</button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-primary-600" /></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                {error && <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg"><p className="text-sm text-danger-600">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Link<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}

          {view === 'reset-sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-success-600" /></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">We've sent a password reset link to <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>. Click the link in the email to reset your password.</p>
              <button onClick={() => { setView('signin'); setEmail(''); setError(null); }} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm">Back to Sign In</button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Didn't receive an email? <button onClick={() => { setView('forgot-password'); setLoading(false); }} className="text-primary-600 hover:text-primary-700 font-medium">Try again</button></p>
            </div>
          )}

          {view === 'reset-password' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-primary-600" /></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Reset Your Password</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter a new password for your account.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
                  </div>
                </div>
                {error && <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg"><p className="text-sm text-danger-600">{error}</p></div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password<ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">By continuing, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  );
}
