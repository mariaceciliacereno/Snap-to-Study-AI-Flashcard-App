import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Code2,
  FileSpreadsheet,
  FileText,
  Database
} from 'lucide-react';
import { FlashcardDeck } from '../types';
import { exportService } from '../services/exportService';

interface ExportModalProps {
  decks: FlashcardDeck[];
  selectedDeck?: FlashcardDeck;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  decks,
  selectedDeck: initialDeck,
  onClose,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    initialDeck?.id || decks[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'rn' | 'anki' | 'quizlet' | 'json'>('rn');
  const [copied, setCopied] = useState(false);

  const currentDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string, mimeType: string) => {
    exportService.downloadFile(filename, content, mimeType);
  };

  if (!currentDeck) return null;

  const ankiContent = exportService.toAnki(currentDeck);
  const quizletContent = exportService.toQuizlet(currentDeck);
  const rnCode = exportService.toReactNativeAppCode(currentDeck);
  const jsonContent = JSON.stringify(currentDeck, null, 2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Export & Antigravity IDE Code
              </h2>
              <p className="text-xs text-slate-400">
                Export to React Native, Anki, Quizlet, or JSON format
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deck Selector & Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          {/* Deck select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Deck:</span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:ring-2 focus:ring-indigo-500 outline-none max-w-[220px] truncate"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.title} ({d.cards.length} cards)
                </option>
              ))}
            </select>
          </div>

          {/* Formats Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('rn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'rn'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-300" />
              <span>React Native (Antigravity)</span>
            </button>
            <button
              onClick={() => setActiveTab('anki')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'anki'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Anki (.txt)</span>
            </button>
            <button
              onClick={() => setActiveTab('quizlet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'quizlet'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quizlet</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'json'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === 'rn' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Antigravity IDE & VSCode Antigravity Native Blueprint</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  This production-ready React Native Expo template includes camera capture with{' '}
                  <code className="text-indigo-300 bg-indigo-950 px-1 py-0.5 rounded">expo-camera</code>, smooth 3D flip card animations using{' '}
                  <code className="text-indigo-300 bg-indigo-950 px-1 py-0.5 rounded">react-native-reanimated</code>, and Leitner spaced repetition.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => handleDownload('App.tsx', rnCode, 'text/typescript')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download App.tsx</span>
                  </button>
                  <button
                    onClick={() => handleDownload('package.json', exportService.toReactNativePackageJson(), 'application/json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download package.json</span>
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>App.tsx (React Native Expo)</span>
                  <button
                    onClick={() => handleCopy(rnCode)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
                  <code>{rnCode}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'anki' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-2">
                <h4 className="font-bold text-white text-sm">Anki Import Guide</h4>
                <p className="text-slate-300 leading-relaxed">
                  In Anki, click <strong>File &gt; Import</strong>, choose this file, set <em>Field separator</em> to <strong>Tab</strong>, and ensure <em>Allow HTML in fields</em> is checked.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDownload(`${currentDeck.title.replace(/\s+/g, '_')}_anki.txt`, ankiContent, 'text/tab-separated-values')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Anki Deck (.txt)</span>
                  </button>
                  <button
                    onClick={() => handleCopy(ankiContent)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Anki Text'}</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                  {ankiContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'quizlet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 space-y-2">
                <h4 className="font-bold text-white text-sm">Quizlet Import Instructions</h4>
                <p className="text-slate-300 leading-relaxed">
                  In Quizlet, click <strong>+ Create Study Set &gt; Import from Word, Excel, Google Docs</strong>, and paste the text below. Terms and definitions are tab-separated.
                </p>
                <button
                  onClick={() => handleCopy(quizletContent)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Quizlet Text!' : 'Copy Formatted Text'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                  {quizletContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Standard JSON Study Deck</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(jsonContent)}
                    className="p-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={() => handleDownload(`${currentDeck.id}.json`, jsonContent, 'application/json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
                  <code>{jsonContent}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
