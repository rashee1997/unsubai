'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  ArrowLeft,
  Moon,
  Sun,
  Key,
  Briefcase,
  FileText,
  Flame,
  RotateCcw,
  Bot,
  HelpCircle,
  Clock,
  Layers,
  Edit3,
  X,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import {
  AppSettings,
  CustomFilterRule,
  getStoredSettings,
  saveStoredSettings,
  DEFAULT_PRESET_RULES,
} from '@/lib/settings';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleInstruction, setNewRuleInstruction] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [editCategory, setEditCategory] = useState<'protection' | 'priority' | 'custom'>('custom');
  const [testEmailSubject, setTestEmailSubject] = useState('Weekly Tech Newsletter #142');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    saveStoredSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all AI filtering rules and scan settings to defaults?')) {
      const def = {
        customInstructionsText: '',
        presetRules: DEFAULT_PRESET_RULES,
        scanDefaults: {
          timeframe: '30d' as const,
          mode: 'unopened' as const,
          maxResults: 50,
        },
        aiSafetyEnforcement: true,
        autoArchiveOnTrash: false,
      };
      setSettings(def);
      saveStoredSettings(def);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const togglePresetRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      presetRules: prev.presetRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    }));
  };

  const deleteRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      presetRules: prev.presetRules.filter((rule) => rule.id !== id),
    }));
  };

  const startEditingRule = (rule: CustomFilterRule) => {
    setEditingRuleId(rule.id);
    setEditTitle(rule.title);
    setEditDescription(rule.description || '');
    setEditInstruction(rule.instruction);
    setEditCategory(rule.category);
  };

  const cancelEditingRule = () => {
    setEditingRuleId(null);
    setEditTitle('');
    setEditDescription('');
    setEditInstruction('');
  };

  const handleSaveRuleEdit = (ruleId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editInstruction.trim()) return;

    setSettings((prev) => ({
      ...prev,
      presetRules: prev.presetRules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              title: editTitle.trim(),
              description: editDescription.trim(),
              instruction: editInstruction.trim(),
              category: editCategory,
            }
          : rule
      ),
    }));

    setEditingRuleId(null);
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim() || !newRuleInstruction.trim()) return;

    const newRule: CustomFilterRule = {
      id: `custom_${Date.now()}`,
      title: newRuleTitle.trim(),
      description: 'User-defined custom filtering rule',
      instruction: newRuleInstruction.trim(),
      enabled: true,
      category: 'custom',
    };

    setSettings((prev) => ({
      ...prev,
      presetRules: [...prev.presetRules, newRule],
    }));

    setNewRuleTitle('');
    setNewRuleInstruction('');
    setIsAddingRule(false);
  };

  const handleSimulateAiRule = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      const textLower = testEmailSubject.toLowerCase();
      const customText = settings.customInstructionsText.toLowerCase();

      let priority = 'High Priority (Recommend Unsubscribe)';
      let matchedRule = 'Default AI Heuristics';

      if (textLower.includes('job') || textLower.includes('career') || textLower.includes('linkedin')) {
        priority = 'Low Priority / Keep (Job Alert Protection)';
        matchedRule = '💼 Job Alerts & Career Notifications Protection';
      } else if (textLower.includes('receipt') || textLower.includes('invoice') || textLower.includes('statement')) {
        priority = 'Low Priority / Keep (Financial Receipt Protection)';
        matchedRule = '🧾 Preserve Financial Statements & Receipts';
      } else if (customText && customText.split('\n').some((line) => textLower.includes(line.trim()))) {
        priority = 'Custom Rule Match (User Overridden)';
        matchedRule = 'User Direct Prompt Instructions';
      }

      setTestResult(`Rule Evaluated: "${matchedRule}" → Priority Classification: ${priority}`);
      setIsTesting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar
        userEmail="rasheedhmech03@gmail.com"
        isConnected={true}
        onConnect={() => {}}
        onDisconnect={() => {}}
        isScanning={false}
        unsubscribedCount={2}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
        {/* Header Breadcrumb Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
              <Link href="/" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <span>/</span>
              <span>AI Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              AI Filter & Scanner Settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Customize natural language rules for Gemini AI, set safety thresholds, and manage scan defaults.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-full glass-pill text-slate-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 backdrop-blur-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center space-x-2 cursor-pointer active:scale-95 backdrop-blur-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Settings and AI custom instructions successfully saved! They will take effect on your next scan.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Card 1: Custom AI Prompt Instructions */}
            <section className="glass-panel p-6 space-y-5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-200/80 dark:border-indigo-800/40 backdrop-blur-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Custom AI Prompt Instructions</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Direct Gemini AI on what to keep, flag, or protect</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/40 backdrop-blur-md">
                  Gemini 3.5 Flash Prompting
                </span>
              </div>

              <div>
                <label htmlFor="custom-instructions" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                  Direct Instruction Rules (Plain English)
                </label>
                <textarea
                  id="custom-instructions"
                  rows={4}
                  value={settings.customInstructionsText}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, customInstructionsText: e.target.value }))
                  }
                  placeholder="e.g., Never unsubscribe from emails sent by my university or containing tax documents. Always prioritize e-commerce coupon digests as High Priority..."
                  className="glass-input w-full p-3.5 rounded-2xl font-mono text-sm resize-y"
                />
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                  These instructions are passed directly to Gemini AI during inbox evaluation.
                </p>
              </div>
            </section>

            {/* Card 2: Preset AI Filter Rules Manager */}
            <section className="glass-panel p-6 space-y-5 transition-all">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    AI Filter Protection Modules
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Toggle built-in safety rules to enforce specific inbox handling heuristics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingRule(!isAddingRule)}
                  className="px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100/80 transition-all flex items-center space-x-1 cursor-pointer backdrop-blur-md active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>

              {/* Add Custom Rule Form */}
              {isAddingRule && (
                <form onSubmit={handleAddCustomRule} className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-indigo-500/30 space-y-3 animate-in fade-in backdrop-blur-md">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Add Custom AI Filter Rule</h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Rule Title (e.g. Protect Alumni Newsletters)"
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      placeholder="AI Instruction (e.g. If sender email ends in .edu, set unsubscribePriority to low and safetyWarning to Alumni Email)"
                      value={newRuleInstruction}
                      onChange={(e) => setNewRuleInstruction(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRule(false)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm transition-all active:scale-95"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-3">
                {settings.presetRules.map((rule) => {
                  const isEditingThisRule = editingRuleId === rule.id;

                  if (isEditingThisRule) {
                    return (
                      <form
                        key={rule.id}
                        onSubmit={(e) => handleSaveRuleEdit(rule.id, e)}
                        className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-zinc-900/90 border border-indigo-500/40 space-y-3 animate-in fade-in backdrop-blur-md shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit AI Rule ({rule.category})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={cancelEditingRule}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                            Rule Title
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="glass-input w-full px-3 py-1.5 text-xs font-semibold"
                            placeholder="e.g. 💼 Protect Job Alerts"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                              Description / Context
                            </label>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="glass-input w-full px-3 py-1.5 text-xs"
                              placeholder="Brief description of what this rule protects"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                              Rule Type / Category
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as any)}
                              className="glass-input w-full px-3 py-1.5 text-xs"
                            >
                              <option value="protection">Protection (Low Priority)</option>
                              <option value="priority">Priority (High Score)</option>
                              <option value="custom">Custom Heuristic</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                            Gemini AI Prompt Instruction
                          </label>
                          <textarea
                            rows={2}
                            value={editInstruction}
                            onChange={(e) => setEditInstruction(e.target.value)}
                            className="glass-input w-full px-3 py-1.5 text-xs font-mono"
                            placeholder="Exact prompt instruction passed to AI analyzer"
                            required
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={cancelEditingRule}
                            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 backdrop-blur-md ${
                        rule.enabled
                          ? 'bg-white/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/10 shadow-xs'
                          : 'bg-white/30 dark:bg-zinc-900/20 border-slate-200/40 dark:border-white/5 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{rule.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              rule.category === 'protection'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50'
                                : rule.category === 'priority'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300/50'
                                : 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-300/50'
                            }`}
                          >
                            {rule.category}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-xs text-slate-600 dark:text-zinc-400">{rule.description}</p>
                        )}
                        <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 pt-1 leading-relaxed">
                          AI Rule: &quot;{rule.instruction}&quot;
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 pt-1">
                        {/* Edit Rule Button */}
                        <button
                          type="button"
                          onClick={() => startEditingRule(rule)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit rule prompt & details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => togglePresetRule(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            rule.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        {rule.category === 'custom' && (
                          <button
                            type="button"
                            onClick={() => deleteRule(rule.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="Delete custom rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Card 3: AI Rule Simulator / Interactive Tester */}
            <section className="glass-panel p-6 space-y-4 transition-all">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Live AI Rule Simulator</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Test how your current AI rules evaluate sample email subjects in real-time.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testEmailSubject}
                  onChange={(e) => setTestEmailSubject(e.target.value)}
                  placeholder="Enter sample subject line..."
                  className="glass-input flex-1 px-3.5 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSimulateAiRule}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50 active:scale-95 backdrop-blur-md"
                >
                  {isTesting ? 'Evaluating...' : 'Simulate Rule Evaluation'}
                </button>
              </div>

              {testResult && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 text-xs font-mono animate-in fade-in backdrop-blur-md">
                  {testResult}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1 col): Scan Defaults, Appearance, Google Auth */}
          <div className="space-y-8">
            {/* Appearance & Theme Selector */}
            <section className="glass-panel p-6 space-y-4 transition-all">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                Theme & Accessibility
              </h2>

              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Choose your visual interface theme for extended email cleanup sessions.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                    theme === 'dark'
                      ? 'bg-zinc-900/90 border-indigo-500 text-white shadow-md'
                      : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="font-bold text-sm">Dark Theme</div>
                  <div className="text-[11px] text-zinc-500">Deep obsidian glass</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                    theme === 'light'
                      ? 'bg-white border-indigo-600 text-slate-900 shadow-md'
                      : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className="font-bold text-sm">Light Theme</div>
                  <div className="text-[11px] text-slate-500">Frosted light glass</div>
                </button>
              </div>
            </section>

            {/* Scan Defaults */}
            <section className="glass-panel p-6 space-y-4 transition-all">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Default Scan Settings
              </h2>

              {/* Timeframe */}
              <div>
                <label htmlFor="timeframe-select" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Scan Timeframe
                </label>
                <select
                  id="timeframe-select"
                  value={settings.scanDefaults.timeframe}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scanDefaults: { ...prev.scanDefaults, timeframe: e.target.value as any },
                    }))
                  }
                  className="glass-input w-full px-3 py-2 text-sm"
                >
                  <option value="7d">Past 7 Days</option>
                  <option value="14d">Past 14 Days</option>
                  <option value="30d">Past 30 Days (Recommended)</option>
                  <option value="60d">Past 60 Days</option>
                  <option value="90d">Past 90 Days</option>
                  <option value="180d">Past 180 Days (Deep Clean)</option>
                </select>
              </div>

              {/* Mode */}
              <div>
                <label htmlFor="scan-mode-select" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Scan Target
                </label>
                <select
                  id="scan-mode-select"
                  value={settings.scanDefaults.mode}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scanDefaults: { ...prev.scanDefaults, mode: e.target.value as any },
                    }))
                  }
                  className="glass-input w-full px-3 py-2 text-sm"
                >
                  <option value="unopened">Unopened Subscriptions & Promos</option>
                  <option value="all_subscriptions">All Recurring Subscriptions</option>
                  <option value="job_alerts">Job Alerts & Career Notifications</option>
                  <option value="untouched_promos">Stale Promotional Inbox</option>
                </select>
              </div>

              {/* Max Senders */}
              <div>
                <label htmlFor="max-results-select" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Max Senders Analyzed Per Scan
                </label>
                <select
                  id="max-results-select"
                  value={settings.scanDefaults.maxResults}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scanDefaults: { ...prev.scanDefaults, maxResults: parseInt(e.target.value, 10) },
                    }))
                  }
                  className="glass-input w-full px-3 py-2 text-sm"
                >
                  <option value={25}>25 Senders (Fast Scan)</option>
                  <option value={50}>50 Senders (Standard)</option>
                  <option value={100}>100 Senders (Thorough)</option>
                </select>
              </div>
            </section>

            {/* OAuth Credentials Status */}
            <section className="glass-panel p-6 space-y-4 transition-all">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Google Workspace Connection
              </h2>

              <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-white/10 text-xs space-y-2 backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-zinc-400">Account:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">rasheedhmech03@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-zinc-400">Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active OAuth
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
