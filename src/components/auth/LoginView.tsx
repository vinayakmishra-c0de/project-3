import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Division } from '../../types';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  resetCustomFirebaseConfig,
  FirebaseConfigObject,
} from '../../firebase';
import {
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  BookOpen,
  Layers,
  AlertCircle,
  Database,
  Key,
  Settings,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  FileCode,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<Division>('uniform');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firebase Configuration Modal / Panel State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeConfig, setActiveConfig] = useState<FirebaseConfigObject>(() => getActiveFirebaseConfig());
  const [configForm, setConfigForm] = useState<FirebaseConfigObject>(() => getActiveFirebaseConfig());
  const [rawConfigPaste, setRawConfigPaste] = useState('');
  const [configSavedToast, setConfigSavedToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please enter both administrator email and password.');
      return;
    }

    setIsLoading(true);
    const res = await login(cleanEmail, cleanPass, selectedDivision);
    setIsLoading(false);

    if (!res.success) {
      setError(
        res.error ||
          'Authentication failed. Please verify that this user exists in your Firebase project Authentication console.'
      );
    }
  };

  // Parse raw pasted Firebase SDK config (JSON or JS object snippet)
  const handleParseRawConfig = () => {
    if (!rawConfigPaste.trim()) return;
    try {
      let text = rawConfigPaste.trim();
      // Remove JS variable assignment if present (e.g. const firebaseConfig = {...})
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        text = braceMatch[0];
      }
      // If it has unquoted keys like apiKey: "...", convert to valid JSON
      const jsonLike = text
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
        .replace(/,\s*\}/g, '}')
        .replace(/'/g, '"');

      const parsed = JSON.parse(jsonLike);
      setConfigForm((prev) => ({
        ...prev,
        apiKey: parsed.apiKey || prev.apiKey,
        authDomain: parsed.authDomain || prev.authDomain,
        projectId: parsed.projectId || prev.projectId,
        storageBucket: parsed.storageBucket || prev.storageBucket,
        messagingSenderId: parsed.messagingSenderId || prev.messagingSenderId,
        appId: parsed.appId || prev.appId,
        firestoreDatabaseId: parsed.firestoreDatabaseId || prev.firestoreDatabaseId,
      }));
      setRawConfigPaste('');
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch (e) {
      setError('Unable to parse the pasted configuration snippet. Please fill in the fields below manually.');
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig(configForm);
    setActiveConfig(configForm);
    setConfigSavedToast(true);
    setTimeout(() => {
      // Reload app to re-initialize Firebase SDK with updated configuration
      window.location.reload();
    }, 800);
  };

  const handleResetFirebaseConfig = () => {
    resetCustomFirebaseConfig();
    const defaultConfig = getActiveFirebaseConfig();
    setConfigForm(defaultConfig);
    setActiveConfig(defaultConfig);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 shadow-xl shadow-blue-500/20 mb-3 bg-slate-950 ring-1 ring-white/10">
            <img
              src="/assets/aistudio/Screenshot_2026-10-08_142919_1e22bef8.png"
              alt="NEPS Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">New Era Public School</h1>
          <p className="text-xs text-blue-400 font-semibold mt-1">NEPS Campus Retail & Inventory Management Portal</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-300 text-xs font-medium mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Firebase Authentication Gateway</span>
          </div>
        </div>

        {/* Division Selector Toggle */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
            Select Store Division
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedDivision('uniform')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDivision === 'uniform'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Uniform Division</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('books')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDivision === 'books'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Books & Stationery</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2 px-1 text-[11px] text-slate-400">
            <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Active workspace:{' '}
              <strong className="text-slate-200">
                {selectedDivision === 'uniform' ? 'Uniform Store' : 'Books & Stationery Store'}
              </strong>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Pure Sign In Form (Register Admin Removed As Requested) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@school.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-medium text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2 ${
              selectedDivision === 'books'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              `Sign In to ${selectedDivision === 'books' ? 'Books & Stationery' : 'Uniform'} Dashboard`
            )}
          </button>
        </form>

        {/* Firebase Project & API Key Configuration Trigger */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[170px]" title={activeConfig.projectId}>
                Project: <strong className="text-slate-200">{activeConfig.projectId}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Configure Firebase Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Firebase API Key and Project Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 text-white relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Firebase API Key & Credentials</h3>
                  <p className="text-[11px] text-slate-400">
                    Connect your Firebase project credentials or edit active API keys
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSavedToast && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuration saved successfully! Reloading connection...</span>
              </div>
            )}

            {/* Quick paste helper */}
            <div className="mb-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Paste Firebase Config Snippet (Optional)</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Paste your <code className="text-amber-300 font-mono">const firebaseConfig = &#123; ... &#125;</code> code from the Firebase Console to auto-fill all fields:
              </p>
              <div className="flex gap-2">
                <textarea
                  value={rawConfigPaste}
                  onChange={(e) => setRawConfigPaste(e.target.value)}
                  rows={2}
                  placeholder='apiKey: "AIza...", projectId: "...", ...'
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleParseRawConfig}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer self-end transition-colors"
                >
                  Apply Snippet
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Firebase API Key (apiKey) *
                </label>
                <input
                  type="text"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value.trim() })}
                  required
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Project ID (projectId) *
                  </label>
                  <input
                    type="text"
                    value={configForm.projectId}
                    onChange={(e) => setConfigForm({ ...configForm, projectId: e.target.value.trim() })}
                    required
                    placeholder="my-school-project"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Auth Domain (authDomain) *
                  </label>
                  <input
                    type="text"
                    value={configForm.authDomain}
                    onChange={(e) => setConfigForm({ ...configForm, authDomain: e.target.value.trim() })}
                    required
                    placeholder="project.firebaseapp.com"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    App ID (appId) *
                  </label>
                  <input
                    type="text"
                    value={configForm.appId}
                    onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value.trim() })}
                    required
                    placeholder="1:12345:web:abcd"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={configForm.storageBucket || ''}
                    onChange={(e) => setConfigForm({ ...configForm, storageBucket: e.target.value.trim() })}
                    placeholder="project.firebasestorage.app"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={configForm.messagingSenderId || ''}
                    onChange={(e) => setConfigForm({ ...configForm, messagingSenderId: e.target.value.trim() })}
                    placeholder="874393341475"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Firestore Database ID
                  </label>
                  <input
                    type="text"
                    value={configForm.firestoreDatabaseId || ''}
                    onChange={(e) => setConfigForm({ ...configForm, firestoreDatabaseId: e.target.value.trim() })}
                    placeholder="(default) or custom DB ID"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-4 gap-2">
                <button
                  type="button"
                  onClick={handleResetFirebaseConfig}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to App Defaults</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Connect Firebase</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
