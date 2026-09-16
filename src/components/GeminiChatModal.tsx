import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  X,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Sparkles,
  Zap,
  Brain,
  Sliders,
  RefreshCw,
  Clock,
  GraduationCap,
  Code2,
  HelpCircle,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

export interface ChatRole {
  id: string;
  name: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  defaultModel: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
  systemInstruction: string;
  samplePrompts: string[];
}

export const CHAT_ROLES: ChatRole[] = [
  {
    id: 'general_assistant',
    name: 'Professioneller Assistent',
    shortDesc: 'Universeller KI-Assistent für Recherche, Analysen, Texte & Wissen',
    icon: Sparkles,
    color: '#3b82f6',
    defaultModel: 'gemini-3.5-flash',
    systemInstruction:
      'Du bist ein professioneller, vielseitiger und hochkompetenter KI-Assistent auf Basis neuester Google Gemini Modelle. Du unterstützt den Nutzer präzise, faktenbasiert, lösungsorientiert und strukturiert bei allen erdenklichen Aufgaben: Von Recherchen, Analysen, professionellen Texten und E-Mails über logische und technische Fragestellungen bis hin zu Allgemeinwissen und Problemlösungen. Antworte in klarem, professionellem Deutsch (oder der Sprache der Nutzeranfrage), gut gegliedert mit Markdown-Formatierung.',
    samplePrompts: [
      'Fasse mir einen komplexen Sachverhalt klar und strukturiert zusammen.',
      'Formuliere einen professionellen Textentwurf oder eine E-Mail.',
      'Erkläre ein anspruchsvolles Konzept verständlich mit Beispielen.',
      'Analysiere eine Fragestellung und erstelle einen logischen Lösungsansatz.',
    ],
  },
  {
    id: 'complex_expert',
    name: 'Code- & Analyse-Experte',
    shortDesc: 'Programmierung, Software-Architektur, Logik & Mathematik',
    icon: Code2,
    color: '#8b5cf6',
    defaultModel: 'gemini-3.1-pro-preview',
    systemInstruction:
      'Du bist ein spezialisierter KI-Experte für anspruchsvolle Programmierung (TypeScript, Python, Web, Algorithmen), Software-Architektur, Logik und mathematisch-naturwissenschaftliche Fragestellungen. Liefere stets sauberen, präzisen Code, fundierte Erklärungen und mathematisch nachvollziehbare Schritte.',
    samplePrompts: [
      'Erstelle eine performante TypeScript-Funktion für ein konkretes Problem.',
      'Analysiere einen Algorithmus und schlage Optimierungen vor.',
      'Erkläre die mathematischen Hintergründe eines Verfahrens.',
    ],
  },
  {
    id: 'fast_info',
    name: 'Direkte Kurzauskunft',
    shortDesc: 'Schnelle Fakten, Definitionen & kompakte Antworten',
    icon: Zap,
    color: '#f59e0b',
    defaultModel: 'gemini-3.1-flash-lite',
    systemInstruction:
      'Du bist ein extrem schneller Auskunfts-Assistent. Antworte maximal prägnant, direkt auf den Punkt, ohne überflüssige Einleitungen oder Füllwörter. Gib die Kernantwort in 1-3 präzisen Sätzen.',
    samplePrompts: [
      'Was bedeutet dieser Fachbegriff kurz und prägnant?',
      'Nenne mir die 3 wichtigsten Fakten zu diesem Thema.',
      'Was ist der Unterschied zwischen diesen beiden Begriffen?',
    ],
  },
  {
    id: 'creative_writing',
    name: 'Kreativ & Formulierung',
    shortDesc: 'Ideenfindung, Schreibberatung, Formulierungen & Entwürfe',
    icon: Brain,
    color: '#10b981',
    defaultModel: 'gemini-3.5-flash',
    systemInstruction:
      'Du bist ein inspirierender, stilsicherer Schreib- und Kreativpartner. Hilf dem Nutzer beim Brainstorming innovativer Ideen, beim Verfassen ausdrucksstarker Texte, Präsentationskonzepte und ansprechender Formulierungen.',
    samplePrompts: [
      'Gib mir 5 innovative Ansätze für ein neues Vorhaben.',
      'Optimiere diesen Textabschnitt für einen überzeugenden Vortrag.',
      'Erstelle ein kurzes, prägnantes Konzept.',
    ],
  },
  {
    id: 'custom',
    name: 'Benutzerdefiniert',
    shortDesc: 'Eigene System-Instruction für die Gemini-KI definieren',
    icon: Sliders,
    color: '#ec4899',
    defaultModel: 'gemini-3.5-flash',
    systemInstruction: 'Du bist ein professioneller, nützlicher KI-Assistent. Befolge die Anweisungen des Benutzers genau.',
    samplePrompts: [
      'Beantworte meine Frage nach deinen benutzerdefinierten Richtlinien.',
    ],
  },
];

const STORAGE_CHAT_KEY = 'webclock_gemini_chat_history_v2';
const STORAGE_ROLE_KEY = 'webclock_gemini_chat_selected_role_v2';
const STORAGE_CUSTOM_SYS_KEY = 'webclock_gemini_chat_custom_system_v2';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  backdropBlur?: number;
  accentColor?: string;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  backdropBlur = 20,
  accentColor = '#38bdf8',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROLE_KEY);
      if (saved && saved !== 'time_coach' && CHAT_ROLES.some((r) => r.id === saved)) {
        return saved;
      }
      return 'general_assistant';
    } catch {
      return 'general_assistant';
    }
  });

  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_CUSTOM_SYS_KEY) ||
        'Du bist ein professioneller, nützlicher Universal-KI-Assistent auf Basis neuester Google Gemini Modelle.'
      );
    } catch {
      return 'Du bist ein professioneller, nützlicher Universal-KI-Assistent auf Basis neuester Google Gemini Modelle.';
    }
  });

  // Model selection: 'auto' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeRole = CHAT_ROLES.find((r) => r.id === selectedRoleId) || CHAT_ROLES[0];

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // Ignore storage limit
    }
  }, [messages]);

  // Save selected role
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, selectedRoleId);
    } catch {
      // Ignore
    }
  }, [selectedRoleId]);

  // Save custom system prompt
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_SYS_KEY, customSystemPrompt);
    } catch {
      // Ignore
    }
  }, [customSystemPrompt]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  // Determine effective model to use
  const getEffectiveModel = (userText: string): string => {
    if (selectedModel !== 'auto') {
      return selectedModel;
    }
    // Check if role has a default model
    if (activeRole.id === 'complex_expert') return 'gemini-3.1-pro-preview';
    if (activeRole.id === 'fast_info') return 'gemini-3.1-flash-lite';

    // Auto-detect based on task complexity
    const lower = userText.toLowerCase();
    const isComplex =
      lower.includes('code') ||
      lower.includes('programm') ||
      lower.includes('algorithmus') ||
      lower.includes('formel') ||
      lower.includes('mathe') ||
      lower.includes('beweis') ||
      lower.includes('architektur') ||
      lower.includes('typescript') ||
      lower.includes('komplex');

    if (isComplex) return 'gemini-3.1-pro-preview';

    const isFast =
      userText.length < 35 ||
      lower.startsWith('was ist') ||
      lower.startsWith('kurz') ||
      lower.startsWith('schnell') ||
      lower.startsWith('wann');

    if (isFast) return 'gemini-3.1-flash-lite';

    return 'gemini-3.5-flash';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptToSend = (textToSend || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setInputPrompt('');
    setIsLoading(true);

    const effectiveModel = getEffectiveModel(promptToSend);
    const systemInstruction =
      activeRole.id === 'custom' ? customSystemPrompt : activeRole.systemInstruction;

    try {
      // Send conversation history to /api/gemini/chat
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          systemInstruction,
          model: effectiveModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fehler beim Abrufen der Gemini-Antwort');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply || '(Keine Antwort erhalten)',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || effectiveModel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err?.message || 'Verbindungsfehler zur Gemini KI. Bitte versuche es erneut.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Möchtest du den bisherigen Chat-Verlauf wirklich löschen?')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_CHAT_KEY);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const RoleIcon = activeRole.icon;

  return (
    <div
      id="gemini-chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/75 transition-opacity duration-300"
      style={{ backdropFilter: `blur(${Math.min(backdropBlur, 24)}px)` }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        id="gemini-chat-modal-container"
        className="relative w-full max-w-3xl h-[88vh] max-h-[750px] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
              style={{
                backgroundColor: `${activeRole.color}25`,
                borderColor: `${activeRole.color}50`,
                borderWidth: '1px',
              }}
            >
              <RoleIcon className="w-5 h-5" style={{ color: activeRole.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Gemini Chatbot</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRoleConfig((p) => !p)}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1"
                  style={{
                    backgroundColor: `${activeRole.color}20`,
                    borderColor: `${activeRole.color}40`,
                    color: activeRole.color,
                  }}
                  title="Modus oder Rolle anpassen"
                >
                  <span>{activeRole.name}</span>
                  <Sliders className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Professioneller KI-Assistent • Bereit</span>
              </div>
            </div>
          </div>

          {/* Model Selector & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Model Selector dropdown/pills */}
            <div className="hidden sm:flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-[11px]">
              {[
                { id: 'auto', label: 'Auto' },
                { id: 'gemini-3.5-flash', label: '3.5 Flash' },
                { id: 'gemini-3.1-pro-preview', label: '3.1 Pro' },
                { id: 'gemini-3.1-flash-lite', label: '3.1 Lite' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedModel === m.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={
                    m.id === 'auto'
                      ? 'Automatische Wahl je nach Aufgabe'
                      : m.id === 'gemini-3.1-pro-preview'
                      ? 'gemini-3.1-pro-preview für komplexe Aufgaben'
                      : m.id === 'gemini-3.1-flash-lite'
                      ? 'gemini-3.1-flash-lite für schnelle Aufgaben'
                      : 'gemini-3.5-flash für allgemeine Aufgaben'
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Chat-Verlauf leeren"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Configuration Drawer (Collapsible) */}
        {showRoleConfig && (
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Rolle & System-Anweisung wählen
              </span>
              <button
                type="button"
                onClick={() => setShowRoleConfig(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Fertig
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHAT_ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      if (selectedModel === 'auto') {
                        setSelectedModel(role.defaultModel);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 text-blue-100 ring-1 ring-blue-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: role.color }} />
                      <span className="truncate">{role.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{role.shortDesc}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom system prompt input if custom role is selected */}
            {selectedRoleId === 'custom' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Eigene System-Instruction (Rollenanweisung):</span>
                </label>
                <textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Gib hier an, wie die KI sich verhalten soll..."
                />
              </div>
            )}

            {/* Mobile Model selector buttons */}
            <div className="sm:hidden pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Gemini Modell:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                {['auto', 'gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedModel(m)}
                    className={`px-2 py-0.5 rounded ${
                      selectedModel === m ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {m === 'auto'
                      ? 'Auto'
                      : m === 'gemini-3.1-pro-preview'
                      ? 'Pro'
                      : m === 'gemini-3.1-flash-lite'
                      ? 'Lite'
                      : 'Flash'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            /* Empty State with Suggestions */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: `${activeRole.color}25`,
                  borderColor: `${activeRole.color}50`,
                  borderWidth: '1px',
                }}
              >
                <RoleIcon className="w-7 h-7" style={{ color: activeRole.color }} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Wie kann ich dir helfen?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Stelle Fragen zu beliebigen Themen, analysiere Texte oder lass dir bei Recherchen, Planungen und Aufgaben helfen.
                </p>
              </div>

              {/* Sample Prompt Chips */}
              <div className="w-full space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block text-left">
                  Vorgeschlagene Fragen & Themen:
                </span>
                <div className="space-y-2">
                  {activeRole.samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <Send className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message Thread */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                      style={{
                        backgroundColor: `${activeRole.color}25`,
                        borderColor: `${activeRole.color}50`,
                        borderWidth: '1px',
                      }}
                    >
                      <RoleIcon className="w-4 h-4" style={{ color: activeRole.color }} />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {!isUser ? (
                      <div className="space-y-2">
                        <div className="markdown-body prose prose-invert max-w-none text-xs sm:text-sm">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {/* Bottom message info: model badge & copy button */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono">
                              {msg.modelUsed || 'gemini-3.5-flash'}
                            </span>
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Antwort kopieren"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className="text-[10px] text-blue-200/80 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-700/60 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-white">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  backgroundColor: `${activeRole.color}25`,
                  borderColor: `${activeRole.color}50`,
                  borderWidth: '1px',
                }}
              >
                <RoleIcon className="w-4 h-4" style={{ color: activeRole.color }} />
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 flex items-center gap-2 shadow-md">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="animate-pulse">Gemini denkt nach...</span>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-300 hover:text-white underline ml-2 cursor-pointer"
              >
                Schließen
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht an Gemini schreiben... (Enter zum Senden)"
                rows={1}
                disabled={isLoading}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none max-h-32 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="h-11 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Nachricht absenden"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Senden</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between px-1 pt-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>Shift + Enter für neue Zeile</span>
              <span>•</span>
              <span className="text-slate-400">
                Modell: <strong className="text-slate-300">{getEffectiveModel(inputPrompt)}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRoleConfig((p) => !p)}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Rolle & System-Prompt anpassen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
