'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  TrendingUp,
  BrainCircuit,
  Send,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Key,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Palette,
  Lightbulb,
} from 'lucide-react';

const PRESET_PROMPTS = [
  {
    id: 'audit',
    icon: Flame,
    title: 'Full Platform & Template Popularity Audit',
    subtitle: 'Rankings, what people love, and top-converting styles',
    prompt: 'Provide a full analytical audit of our website: rank the top templates people love most, explain why couples prefer them, and identify which templates have low engagement.',
  },
  {
    id: 'conversion',
    icon: TrendingUp,
    title: 'Free-to-Paid Conversion Optimization',
    subtitle: 'Identify drop-offs & actionable tactics to boost revenue',
    prompt: 'Analyze our free-to-paid conversion rate. Where are users dropping off? Give 4 specific, high-impact strategies to increase paid ₹399 conversions without hurting user trust.',
  },
  {
    id: 'trends',
    icon: Palette,
    title: 'Customer Style & Content Preferences',
    subtitle: 'Event types, wording themes & modern luxury trends',
    prompt: 'Based on the event breakdown and template data, what design styles, color palettes, and event types (Weddings vs Birthdays vs Housewarmings) are trending right now?',
  },
  {
    id: 'next-templates',
    icon: Lightbulb,
    title: 'Next 3 High-Demand Template Ideas',
    subtitle: 'Fresh themes to design next for Indian/Kerala weddings',
    prompt: 'Recommend the top 3 new invitation templates we should design next for the upcoming season. Include specific theme names, color schemes, and target demographics.',
  },
];

const AVAILABLE_MODELS = [
  { id: 'minimax/minimax-01', name: 'MiniMax: MiniMax M3 / 01 (Fast & Smart)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
];

export default function AdminAiInsightsTab() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('minimax/minimax-01');
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load any stored OpenRouter key from localStorage for developer convenience
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wi_admin_openrouter_key');
      if (stored) setApiKey(stored);
    } catch {}
  }, []);

  const handleSaveApiKey = (val) => {
    setApiKey(val);
    try {
      if (val) localStorage.setItem('wi_admin_openrouter_key', val);
      else localStorage.removeItem('wi_admin_openrouter_key');
    } catch {}
  };

  const handleRunAnalysis = async (customPromptToRun = null) => {
    const promptToSubmit = customPromptToRun || prompt;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSubmit,
          model: selectedModel,
          ...(apiKey ? { apiKey } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to get AI insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInsights = async () => {
    if (!result?.insights) return;
    try {
      await navigator.clipboard.writeText(result.insights);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const snapshot = result?.metricsSnapshot;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#061812] via-[#0A261C] to-[#0D3224] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/10 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OpenRouter AI Intelligence</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Website &amp; Traffic Intelligence AI
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Powered by <strong className="text-white">MiniMax M3 / MiniMax-01</strong>. Analyzes live database telemetry, customer preferences, and template conversions to give you clear, actionable bullet points.
            </p>
          </div>

          {/* Quick API Key toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>{apiKey ? 'API Key Configured' : 'OpenRouter Key'}</span>
            </button>
          </div>
        </div>

        {/* Expandable API Key Input */}
        {showKeyInput && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in slide-in-from-top-2">
            <div className="relative flex-1">
              <input
                type="password"
                placeholder="sk-or-v1-xxxxxxxxxxxxxxxx (Optional if in .env.local)"
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <span className="text-[11px] text-white/60">
              Key is securely stored in your browser or `.env.local`.
            </span>
          </div>
        )}
      </div>

      {/* Model & Preset Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 1-Click Preset Prompts */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Analytical Actions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_PROMPTS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  disabled={loading}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    handleRunAnalysis(preset.prompt);
                  }}
                  className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-500/50 hover:bg-emerald-50/20 text-left transition-all shadow-sm hover:shadow-md group active:scale-[0.99] disabled:opacity-50 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--ink)] leading-snug group-hover:text-emerald-900 transition-colors">
                        {preset.title}
                      </h4>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 leading-relaxed">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Run Analysis</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Model & Settings */}
        <div className="rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Engine Configuration</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-soft)] block mb-1">
                  Active Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ink)] outline-none focus:border-emerald-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-stone-50 border border-stone-200/60 p-3 text-[11px] text-[var(--ink-muted)] leading-relaxed space-y-1">
                <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configured for Clear Data Only</span>
                </div>
                <p>Output is strictly structured into clear points, metrics takeaways, and action items with zero filler.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleRunAnalysis(prompt || PRESET_PROMPTS[0].prompt)}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Live Metrics…</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Run Full Intelligence Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Custom Question Prompt Box */}
      <div className="rounded-2xl bg-white border border-stone-200/80 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider flex items-center gap-2">
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ask Custom Question to AI</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && prompt.trim()) {
                handleRunAnalysis();
              }
            }}
            placeholder="e.g. Which template is most popular for Kerala weddings and why?"
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
          />
          <button
            onClick={() => handleRunAnalysis()}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-[var(--ink)] hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask Model</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 sm:p-5 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-red-900">AI Request Error</h4>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{error}</p>
            {error.includes('API_KEY_REQUIRED') && (
              <p className="text-[11px] text-red-600 mt-2">
                Tip: Click <strong>"OpenRouter Key"</strong> at the top to paste your OpenRouter key or add <code>OPENROUTER_API_KEY</code> to your <code>.env.local</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Output Card */}
      {result && (
        <div className="rounded-3xl bg-white border border-stone-200/90 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Card Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-stone-50 via-white to-emerald-50/30 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[var(--ink)]">
                  Intelligence Report
                </h4>
                <p className="text-[10px] text-[var(--ink-muted)]">
                  Model: <span className="font-mono">{result.modelUsed}</span> · Generated {new Date(result.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyInsights}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-[11px] font-bold text-[var(--ink-soft)] transition-colors active:scale-95 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Telemetry Snapshot row */}
          {snapshot && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-stone-50/50 border-b border-stone-100 text-center">
              <div className="p-2 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Created</span>
                <span className="text-lg font-bold text-[var(--ink)] font-display">{snapshot.totalInvitations}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Paid Conversions</span>
                <span className="text-lg font-bold text-emerald-700 font-display">{snapshot.paidPublishedCount} ({snapshot.paidConversionRate})</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Free Published</span>
                <span className="text-lg font-bold text-amber-700 font-display">{snapshot.freePublishedCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200/60 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Last 7 Days</span>
                <span className="text-lg font-bold text-blue-700 font-display">+{snapshot.newInLast7Days}</span>
              </div>
            </div>
          )}

          {/* Markdown Content Area */}
          <div className="p-6 sm:p-8">
            <div className="prose prose-sm max-w-none text-stone-800 leading-relaxed font-sans space-y-4">
              {result.insights.split('\n\n').map((paragraph, idx) => {
                // Section Headings
                if (paragraph.startsWith('###') || paragraph.startsWith('##') || paragraph.startsWith('#')) {
                  const cleanHeading = paragraph.replace(/^#+\s*/, '');
                  return (
                    <h3
                      key={idx}
                      className="font-display text-base sm:text-lg font-bold text-emerald-950 pt-3 pb-1 border-b border-stone-100 flex items-center gap-2"
                    >
                      {cleanHeading}
                    </h3>
                  );
                }

                // Bullet Lists
                if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter((l) => l.trim().startsWith('-'));
                  return (
                    <ul key={idx} className="space-y-2 my-2 list-none pl-0">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                          <span dangerouslySetInnerHTML={{ __html: formatMarkdownBold(item.replace(/^-\s*/, '')) }} />
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="text-xs sm:text-sm text-stone-700"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownBold(paragraph) }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMarkdownBold(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-emerald-800">$1</code>');
}
