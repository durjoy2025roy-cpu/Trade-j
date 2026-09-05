import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  sendPasswordReset,
  isFirebaseInitialized,
} from '../utils/firebase';
import { soundEngine } from '../utils/soundEngine';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'RESET';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email.trim() || (!password && mode !== 'RESET')) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (mode === 'REGISTER' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (mode === 'REGISTER' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    soundEngine.play('button_click');

    try {
      if (mode === 'LOGIN') {
        await loginWithEmail(email.trim(), password);
        soundEngine.play('gate_approved');
        setSuccessMsg('Successfully logged in. Loading workspace...');
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (mode === 'REGISTER') {
        await registerWithEmail(email.trim(), password);
        soundEngine.play('gate_approved');
        setSuccessMsg('Account created! Initializing private workspace...');
        setTimeout(() => {
          onClose();
        }, 800);
      } else if (mode === 'RESET') {
        await sendPasswordReset(email.trim());
        soundEngine.play('data_saved');
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err: any) {
      soundEngine.play('warning');
      console.error('Auth error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please log in.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    resetState();
    setLoading(true);
    soundEngine.play('button_click');
    try {
      await loginWithGoogle();
      soundEngine.play('gate_approved');
      setSuccessMsg('Google sign-in successful!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      soundEngine.play('warning');
      console.error('Google auth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    soundEngine.play('button_click');
    setLoading(true);
    try {
      await logoutUser();
      setSuccessMsg('Logged out. Switched to Demo Mode.');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-6 shadow-2xl text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2D35] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 font-bold text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-wider text-white uppercase">
                {currentUser ? 'USER PROFILE & WORKSPACE' : 'AUTHENTICATION & WORKSPACE'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {currentUser
                  ? 'Private cloud database active'
                  : 'Sign in to sync your trading discipline to Firestore'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.play('button_click');
              onClose();
            }}
            className="rounded p-1 text-gray-400 hover:bg-[#252A35] hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* If already logged in */}
        {currentUser ? (
          <div className="mt-5 space-y-4">
            <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <UserIcon className="h-4 w-4 text-blue-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">CURRENT ACCOUNT</span>
              </div>
              <div className="font-mono text-sm font-bold text-white truncate">
                {currentUser.email || currentUser.displayName || 'Authenticated Trader'}
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                UID: <span className="text-gray-400">{currentUser.uid}</span>
              </div>
              <div className="flex items-center space-x-1.5 pt-1 text-[11px] text-[#00C853]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Cloud Firestore user-scoped storage active</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-[#2A2D35] bg-[#0F1115] px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-[#252A35]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center space-x-2 rounded bg-red-600/80 hover:bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out to Demo Mode</span>
              </button>
            </div>
          </div>
        ) : (
          /* Not logged in: Login / Register / Reset Tabs */
          <div className="mt-4 space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 rounded bg-[#0F1115] p-1 border border-[#2A2D35]">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  resetState();
                }}
                className={`py-1.5 text-center font-mono text-[11px] font-bold rounded transition-colors ${
                  mode === 'LOGIN' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  resetState();
                }}
                className={`py-1.5 text-center font-mono text-[11px] font-bold rounded transition-colors ${
                  mode === 'REGISTER' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                REGISTER
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('RESET');
                  resetState();
                }}
                className={`py-1.5 text-center font-mono text-[11px] font-bold rounded transition-colors ${
                  mode === 'RESET' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                RESET
              </button>
            </div>

            {/* Notification messages */}
            {errorMsg && (
              <div className="flex items-center space-x-2 rounded border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center space-x-2 rounded border border-[#00C853]/40 bg-green-950/30 p-2.5 text-xs text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00C853]" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full rounded border border-[#2A2D35] bg-[#0F1115] pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {mode !== 'RESET' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded border border-[#2A2D35] bg-[#0F1115] pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded border border-[#2A2D35] bg-[#0F1115] pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 rounded bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                {mode === 'LOGIN' && (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Terminal</span>
                  </>
                )}
                {mode === 'REGISTER' && (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create Private Workspace</span>
                  </>
                )}
                {mode === 'RESET' && (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Send Reset Email</span>
                  </>
                )}
              </button>
            </form>

            {/* Google Sign-In Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2D35]" />
              </div>
              <span className="relative bg-[#1A1D23] px-2 text-[10px] text-gray-500 uppercase tracking-widest">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded border border-[#2A2D35] bg-[#0F1115] hover:bg-[#252A35] py-2 text-xs font-semibold text-white transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Demo mode option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-gray-500 hover:text-blue-400 transition-colors underline decoration-dotted"
              >
                Continue in Demo Mode (Local Storage Only)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
