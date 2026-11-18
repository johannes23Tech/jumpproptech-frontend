import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Plus,
  Send,
  Trash2,
  Pencil,
  Copy,
  RotateCcw,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';
import './Messages.css';

type Role = 'assistant' | 'user' | 'system';

interface ChatMessage {
  id: string | number;
  role: Role;
  text: string;
  createdAt: string;
  meta?: any;
  pending?: boolean;
  error?: boolean;
}

interface Conversation {
  id: string | number;
  title: string;
  createdAt: string;
  updatedAt: string;
  isLocal?: boolean;
  messages?: ChatMessage[];
  messagesLoaded?: boolean;
}

const WELCOME_TEXT = `Welcome to JUMP FLUX AI.

Your intelligent property management assistant is ready.

Ask me about your properties, tenants, rental income, arrears, maintenance, expenses or portfolio performance.

Let's turn your property data into better decisions.`;

const SUGGESTED_PROMPTS = [
  'How much rent did we collect this month?',
  'Which tenants are behind on rent?',
  'Which properties have vacancies?',
  'What are our total monthly expenses?',
  'Which property generates the highest rental income?',
  'How many leases expire next month?',
  'What maintenance cases remain unresolved?',
  'How is the overall portfolio performing?',
];

const nowIso = () => new Date().toISOString();
const localId = (prefix = 'local') => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

function formatTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatRelative(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function mapServerMessage(m: any): ChatMessage {
  return {
    id: m.id,
    role: m.role === 'user' ? 'user' : 'assistant',
    text: typeof m.content === 'string' ? m.content : String(m.text ?? ''),
    createdAt: m.created_at || m.createdAt || nowIso(),
    meta: m.meta || undefined,
  };
}

type FluxUiSpec =
  | { type: 'choices' | 'multi'; label?: string; options: string[] }
  | { type: 'select'; label?: string; options: string[] };

function parseFluxUi(text: string): { cleanText: string; ui: FluxUiSpec | null; fallbackOptions: string[] } {
  let cleanText = text || '';
  let ui: FluxUiSpec | null = null;

  const blockRe = /```(?:flux-ui|ui|json-ui)\s*([\s\S]*?)```/i;
  const m = cleanText.match(blockRe);
  if (m) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed && Array.isArray(parsed.options)) {
        const options = parsed.options.map((o: any) => String(o)).filter((s: string) => s.trim() !== '');
        const type = parsed.type === 'select' ? 'select' : parsed.type === 'multi' ? 'multi' : 'choices';
        if (options.length > 0) ui = { type, label: typeof parsed.label === 'string' ? parsed.label : undefined, options };
      }
    } catch {
      // ignore invalid UI block
    }
    cleanText = cleanText.replace(blockRe, '').trim();
  }

  // Fallback: detect simple option lists near the end (bullets or numbered)
  const fallbackOptions: string[] = [];
  if (!ui) {
    const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
    const tail = lines.slice(-8);
    const opts = tail
      .map((l) => l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/)?.[1]?.trim() || '')
      .filter((s) => s.length > 0 && s.length <= 80);
    if (opts.length >= 2 && opts.length <= 8) fallbackOptions.push(...opts);
  }

  return { cleanText, ui, fallbackOptions };
}

function mapServerConversation(c: any): Conversation {
  return {
    id: c.id,
    title: c.title || 'New conversation',
    createdAt: c.created_at || nowIso(),
    updatedAt: c.updated_at || c.created_at || nowIso(),
    isLocal: false,
    messages: [],
    messagesLoaded: false,
  };
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState<{ configured: boolean; provider?: string; model?: string | null; message?: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [capturedId, setCapturedId] = useState<string | number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const active = useMemo(
    () => conversations.find((c) => String(c.id) === String(activeId)) || null,
    [conversations, activeId]
  );

  const activeMessages = active?.messages || [];

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [st, convRes] = await Promise.all([
          api.getFluxStatus().catch(() => null),
          api.getFluxConversations().catch(() => ({ conversations: [] })),
        ]);
        if (!alive) return;
        if (st) setStatus(st);
        const list = Array.isArray(convRes?.conversations) ? convRes.conversations.map(mapServerConversation) : [];
        setConversations(list);
        if (list.length > 0) {
          setActiveId(list[0].id);
        } else {
          // Start with a local draft conversation (created on first send)
          const draft: Conversation = { id: localId('draft'), title: 'New conversation', createdAt: nowIso(), updatedAt: nowIso(), isLocal: true, messages: [], messagesLoaded: true };
          setConversations([draft]);
          setActiveId(draft.id);
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Could not load JUMP FLUX AI.');
        const draft: Conversation = { id: localId('draft'), title: 'New conversation', createdAt: nowIso(), updatedAt: nowIso(), isLocal: true, messages: [], messagesLoaded: true };
        setConversations([draft]);
        setActiveId(draft.id);
      } finally {
        if (alive) setInitialLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load messages when selecting a server conversation
  useEffect(() => {
    if (!active || active.isLocal || active.messagesLoaded) return;
    let alive = true;
    (async () => {
      try {
        const res = await api.getFluxConversation(Number(active.id));
        if (!alive) return;
        const msgs = Array.isArray(res?.messages) ? res.messages.map(mapServerMessage) : [];
        setConversations((prev) => prev.map((c) => String(c.id) === String(active.id) ? { ...c, messages: msgs, messagesLoaded: true, title: res?.conversation?.title || c.title, updatedAt: res?.conversation?.updated_at || c.updatedAt } : c));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Could not load conversation.');
      }
    })();
    return () => { alive = false; };
  }, [activeId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [activeMessages.length, isProcessing, activeId]);

  const upsertConversation = (conv: Conversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => String(c.id) === String(conv.id));
      if (idx === -1) return [conv, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...conv };
      // move updated to top
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  };

  const startNewConversation = () => {
    const draft: Conversation = { id: localId('draft'), title: 'New conversation', createdAt: nowIso(), updatedAt: nowIso(), isLocal: true, messages: [], messagesLoaded: true };
    setConversations((prev) => [draft, ...prev.filter((c) => !(c.isLocal && (c.messages?.length || 0) === 0))]);
    setActiveId(draft.id);
    setInput('');
    setError('');
    setNotice('');
    setSidebarOpen(false);
  };

  const deleteConversation = async (conv: Conversation) => {
    if (!window.confirm(`Delete "${conv.title}"? This cannot be undone.`)) return;
    setError('');
    try {
      if (!conv.isLocal) {
        await api.deleteFluxConversation(Number(conv.id));
      }
      setConversations((prev) => {
        const next = prev.filter((c) => String(c.id) !== String(conv.id));
        if (next.length === 0) {
          const draft: Conversation = { id: localId('draft'), title: 'New conversation', createdAt: nowIso(), updatedAt: nowIso(), isLocal: true, messages: [], messagesLoaded: true };
          setActiveId(draft.id);
          return [draft];
        }
        if (String(activeId) === String(conv.id)) setActiveId(next[0].id);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete conversation.');
    }
  };

  const renameConversation = async (conv: Conversation) => {
    const nextTitle = window.prompt('Rename conversation', conv.title);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    setError('');
    try {
      if (conv.isLocal) {
        setConversations((prev) => prev.map((c) => String(c.id) === String(conv.id) ? { ...c, title: trimmed } : c));
      } else {
        const res = await api.updateFluxConversation(Number(conv.id), trimmed);
        const updated = res?.conversation ? mapServerConversation(res.conversation) : null;
        setConversations((prev) => prev.map((c) => String(c.id) === String(conv.id) ? { ...c, title: updated?.title || trimmed, updatedAt: updated?.updatedAt || nowIso() } : c));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not rename conversation.');
    }
  };

  const clearConversation = async () => {
    if (!active) return;
    if (!window.confirm('Clear all messages in this conversation?')) return;
    setError('');
    try {
      if (!active.isLocal) {
        await api.clearFluxConversation(Number(active.id));
      }
      setConversations((prev) => prev.map((c) => String(c.id) === String(active.id) ? { ...c, messages: [], messagesLoaded: true, updatedAt: nowIso() } : c));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not clear conversation.');
    }
  };

  const copyMessage = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId((current) => (current === msg.id ? null : current)), 1500);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const captureFeedback = async (msg: ChatMessage, question?: string) => {
    if (!active || msg.role !== 'assistant') return;
    try {
      await api.captureFluxFeedback({
        conversation_id: active.isLocal ? null : Number(active.id),
        message_id: typeof msg.id === 'number' ? msg.id : null,
        question,
        assistant_response: msg.text,
        capture_type: 'mistake',
        detail: 'user_flagged_issue',
      });
      setCapturedId(msg.id);
      setNotice('Thanks — this response was flagged for review to help improve JUMP FLUX AI.');
      window.setTimeout(() => setCapturedId((current) => (current === msg.id ? null : current)), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit feedback.');
    }
  };

  const sendMessage = async (raw: string) => {
    const question = raw.trim();
    if (!question || !active || isProcessing) return;
    setError('');
    setNotice('');
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const tempUser: ChatMessage = { id: localId('msg_u'), role: 'user', text: question, createdAt: nowIso(), pending: true };
    const currentMessages = active.messages || [];
    const isFirst = currentMessages.every((m) => m.role !== 'user');

    // optimistic append
    setConversations((prev) => prev.map((c) => String(c.id) === String(active.id) ? {
      ...c,
      title: c.isLocal && isFirst ? (question.slice(0, 42) + (question.length > 42 ? '…' : '')) : c.title,
      updatedAt: nowIso(),
      messages: [...currentMessages, tempUser],
      messagesLoaded: true,
    } : c));

    setIsProcessing(true);
    try {
      const res = await api.sendFluxMessage({
        conversation_id: active.isLocal ? null : Number(active.id),
        message: question,
      });

      const serverConv = res?.conversation ? mapServerConversation(res.conversation) : null;
      const userMsg = res?.user_message ? mapServerMessage(res.user_message) : tempUser;
      const assistantMsg = res?.assistant_message ? mapServerMessage(res.assistant_message) : null;
      if (typeof res?.configured === 'boolean') {
        setStatus((prev) => ({ ...(prev || {}), configured: res.configured, message: res.configured ? (prev?.message || 'JUMP FLUX AI is ready.') : (prev?.message || 'AI provider not configured.') }));
      }

      setConversations((prev) => {
        // Replace local/draft conversation with real one if needed
        const withoutDraft = prev.filter((c) => !(String(c.id) === String(active.id) && active.isLocal && serverConv));
        const targetId = serverConv ? serverConv.id : active.id;
        const baseList = withoutDraft.some((c) => String(c.id) === String(targetId)) ? withoutDraft : [serverConv || active, ...withoutDraft];
        return baseList.map((c) => {
          if (String(c.id) !== String(targetId)) return c;
          const msgs = (c.messages || []).filter((m) => String(m.id) !== String(tempUser.id));
          // if this was the draft being replaced, msgs came from draft state in closure? ensure we use current active messages snapshot
          const baseMsgs = (String(c.id) === String(active.id) ? (c.messages || []) : (c.messages || [])).filter((m) => String(m.id) !== String(tempUser.id));
          const merged = [...baseMsgs, userMsg, ...(assistantMsg ? [assistantMsg] : [])];
          return {
            ...c,
            id: targetId,
            isLocal: false,
            title: serverConv?.title || c.title,
            updatedAt: serverConv?.updatedAt || nowIso(),
            createdAt: serverConv?.createdAt || c.createdAt,
            messages: merged,
            messagesLoaded: true,
          };
        }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      });

      if (serverConv) setActiveId(serverConv.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send message. Please try again.';
      setError(msg);
      // mark optimistic message as error-like by keeping it but appending an assistant error note
      setConversations((prev) => prev.map((c) => String(c.id) === String(active.id) ? {
        ...c,
        messages: [...(c.messages || []).filter((m) => String(m.id) !== String(tempUser.id)), { ...tempUser, pending: false }, { id: localId('msg_err'), role: 'assistant', text: msg, createdAt: nowIso(), error: true }],
      } : c));
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerateLast = async () => {
    if (!active || isProcessing) return;
    const msgs = active.messages || [];
    // find last user message
    let lastUser: ChatMessage | null = null;
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      if (msgs[i].role === 'user') { lastUser = msgs[i]; break; }
    }
    if (!lastUser) return;
    await sendMessage(lastUser.text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const onInputChange = (val: string) => {
    setInput(val);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  const showWelcome = !active || (active.messages || []).length === 0;
  const configured = status?.configured !== false; // default to true-ish until known; but status may be null
  const statusKnown = status !== null;

  return (
    <section className={`flux-ai ${isProcessing ? 'is-processing' : ''}`} aria-label="JUMP FLUX AI">
      <div className="flux-ai__media" aria-hidden="true">
        <video
          className="flux-ai__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.jpg"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="flux-ai__scrim" aria-hidden="true" />
      <div className="flux-ai__energy" aria-hidden="true" />

      <div className="flux-ai__shell">
        <div
          className={`flux-sidebar-overlay ${sidebarOpen ? 'is-open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={`flux-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}
          aria-label="Conversation history"
        >
          <div className="flux-sidebar__header">
            <div className="flux-brand">
              <div className="flux-brand__mark" aria-hidden="true">F</div>
              <div>
                <div className="flux-brand__name">JUMP FLUX AI</div>
                <div className="flux-brand__sub">Jump PropTech</div>
              </div>
            </div>
          </div>

          <div className="flux-sidebar__actions">
            <button type="button" className="flux-btn flux-btn--primary" onClick={startNewConversation}>
              <Plus size={16} /> New conversation
            </button>
          </div>

          <div className="flux-sidebar__list" role="list">
            {conversations.map((conv) => (
              <div
                key={String(conv.id)}
                role="button"
                tabIndex={0}
                className={`flux-convo ${String(conv.id) === String(activeId) ? 'is-active' : ''}`}
                onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveId(conv.id); setSidebarOpen(false); } }}
              >
                <div className="flux-convo__main">
                  <div className="flux-convo__title">{conv.title || 'New conversation'}</div>
                  <div className="flux-convo__meta">{conv.isLocal ? 'Draft' : formatRelative(conv.updatedAt || conv.createdAt)}</div>
                </div>
                <div className="flux-convo__actions" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="flux-btn--ghost" title="Rename" onClick={() => void renameConversation(conv)}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="flux-btn--ghost" title="Delete" onClick={() => void deleteConversation(conv)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flux-sidebar__footer">
            <div><strong>Intelligence in Motion.</strong></div>
            <div>Signed in as {user?.full_name || 'user'}. Conversations are saved to your account.</div>
          </div>
        </aside>

        <main className="flux-main">
          <header className="flux-main__header">
            <div className="flux-main__identity">
              <button type="button" className="flux-btn flux-btn--icon flux-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open conversations">
                <Menu size={18} />
              </button>
              <div className="flux-orb" aria-hidden="true">
                <div className="flux-orb__core" />
                <div className="flux-orb__ring" />
                <div className="flux-orb__ring2" />
              </div>
              <div>
                <div className="flux-main__title">JUMP FLUX AI</div>
                <div className="flux-main__tagline">Intelligence in Motion</div>
              </div>
            </div>
            <div className="flux-main__status">
              <span className="flux-pill"><span className="flux-dot" /> {statusKnown ? (configured ? 'Ready' : 'Setup required') : 'Connecting'}</span>
              <button type="button" className="flux-btn flux-btn--icon" title="Clear conversation" onClick={() => void clearConversation()} disabled={!active || (active.messages || []).length === 0 || isProcessing}>
                <MessageSquare size={16} />
              </button>
              <button
                type="button"
                className="flux-btn flux-btn--icon"
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                onClick={() => setSidebarCollapsed((v) => !v)}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>
          </header>

          <div className="flux-main__body">
            <div className="flux-messages" ref={listRef} aria-live="polite" aria-label="Chat messages">
              {initialLoading ? (
                <div className="flux-notice">Loading JUMP FLUX AI…</div>
              ) : showWelcome ? (
                <div className="flux-welcome">
                  <div className="flux-welcome__eyebrow">AI Property Management Assistant · Jump PropTech</div>
                  <h1 className="flux-welcome__title">Intelligence in Motion</h1>
                  <p className="flux-welcome__text">{WELCOME_TEXT}</p>
                </div>
              ) : (
                (active?.messages || []).map((msg, idx, arr) => {
                  const isUser = msg.role === 'user';
                  const isLastAssistant = msg.role === 'assistant' && idx === arr.length - 1;
                  const prevUser = [...arr].slice(0, idx).reverse().find((m) => m.role === 'user');
                  const parsed = !isUser ? parseFluxUi(msg.text) : null;
                  const displayText = parsed ? parsed.cleanText : msg.text;
                  const ui = parsed?.ui || null;
                  const fallbackOptions = parsed?.fallbackOptions || [];
                  return (
                    <div key={String(msg.id)} className={`flux-msg-row ${isUser ? 'flux-msg-row--user' : 'flux-msg-row--assistant'}`}>
                      <div className={`flux-avatar ${isUser ? 'flux-avatar--user' : 'flux-avatar--ai'}`} aria-hidden="true">
                        {isUser ? (user?.full_name?.charAt(0) || 'U') : 'F'}
                      </div>
                      <div className="flux-bubble-wrap">
                        <div className="flux-bubble">{displayText || msg.text}</div>

                        {!isUser && ui && ui.options.length > 0 && (
                          <div className="flux-ui" aria-label="Suggested options">
                            {ui.label && <div className="flux-ui__label">{ui.label}</div>}
                            {ui.type === 'select' ? (
                              <select
                                className="flux-ui__select"
                                defaultValue=""
                                disabled={isProcessing || initialLoading}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (!v) return;
                                  setInput(v);
                                  textareaRef.current?.focus();
                                }}
                              >
                                <option value="">Select an option…</option>
                                {ui.options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flux-ui__choices">
                                {ui.options.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    className="flux-ui__choice"
                                    disabled={isProcessing || initialLoading}
                                    onClick={() => {
                                      if (ui.type === 'multi') {
                                        setInput((prev) => (prev ? `${prev}, ${opt}` : opt));
                                        textareaRef.current?.focus();
                                      } else {
                                        setInput(opt);
                                        textareaRef.current?.focus();
                                      }
                                    }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!isUser && !ui && fallbackOptions.length >= 2 && isLastAssistant && (
                          <div className="flux-ui" aria-label="Quick replies">
                            <div className="flux-ui__label">Quick options</div>
                            <div className="flux-ui__choices">
                              {fallbackOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  className="flux-ui__choice"
                                  disabled={isProcessing || initialLoading}
                                  onClick={() => { setInput(opt); textareaRef.current?.focus(); }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flux-msg-meta">
                          <span>{formatTime(msg.createdAt)}</span>
                          {!isUser && (
                            <span className="flux-msg-actions">
                              <button type="button" className="flux-mini-btn" onClick={() => void copyMessage(msg)} title="Copy response">
                                <Copy size={12} /> {copiedId === msg.id ? 'Copied' : 'Copy'}
                              </button>
                              {isLastAssistant && (
                                <button type="button" className="flux-mini-btn" onClick={() => void regenerateLast()} disabled={isProcessing} title="Ask again">
                                  <RotateCcw size={12} /> Ask again
                                </button>
                              )}
                              <button type="button" className="flux-mini-btn" onClick={() => void captureFeedback(msg, prevUser?.text)} title="Flag response for review (learn from mistake)">
                                <ThumbsDown size={12} /> {capturedId === msg.id ? 'Flagged' : 'Flag'}
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isProcessing && (
                <div className="flux-msg-row flux-msg-row--assistant">
                  <div className="flux-avatar flux-avatar--ai" aria-hidden="true">F</div>
                  <div className="flux-bubble-wrap">
                    <div className="flux-typing" aria-label="JUMP FLUX AI is thinking">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="flux-notice flux-notice--error" role="alert"><AlertCircle size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />{error}</div>}
            {notice && <div className="flux-notice" role="status">{notice}</div>}

            {statusKnown && !status?.configured && (
              <div className="flux-notice" role="note">
                <strong>Setup required:</strong> {status?.message || 'Configure FLUX_AI_PROVIDER, FLUX_AI_API_KEY and FLUX_AI_MODEL on the server to enable live, data-aware responses.'} The chat interface and conversation history remain available.
              </div>
            )}

            <div className="flux-notice" role="note">
              JUMP FLUX AI uses authorized Jump PropTech data within your role permissions. It distinguishes actual records, calculations, and suggestions, and will not take actions that change records or send communications without your explicit confirmation. General South African property information is not legal or tax advice.
            </div>

            <div className="flux-quickbar" aria-label="Quick actions">
              <label className="flux-quickbar__label">
                Quick action
                <select
                  className="flux-quickbar__select"
                  defaultValue=""
                  disabled={isProcessing || initialLoading}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    setInput(v);
                    textareaRef.current?.focus();
                    e.target.value = '';
                  }}
                >
                  <option value="">Choose an intent…</option>
                  <option value="Show rent collected this month and compare to last month.">Rent collected (this month)</option>
                  <option value="List tenants in arrears with amounts and recommended next steps.">Tenants in arrears</option>
                  <option value="Show vacant units by property and building.">Vacant units by property</option>
                  <option value="Summarize unresolved maintenance issues by priority.">Unresolved maintenance</option>
                  <option value="Show total expenses this month by category.">Expenses by category</option>
                  <option value="Which leases expire in the next 60 days?">Leases expiring soon</option>
                  <option value="Give a portfolio performance summary with key risks and actions.">Portfolio summary</option>
                </select>
              </label>
              <div className="flux-suggestions" aria-label="Suggested prompts">
                {SUGGESTED_PROMPTS.map((q) => (
                  <button key={q} type="button" className="flux-chip" disabled={isProcessing || initialLoading} onClick={() => void sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <form className="flux-composer" onSubmit={handleSubmit}>
              <div className="flux-composer__row">
                <textarea
                  ref={textareaRef}
                  className="flux-input"
                  rows={1}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Ask JUMP FLUX AI about properties, tenants, rent, arrears, maintenance, expenses…"
                  aria-label="Message JUMP FLUX AI"
                  disabled={isProcessing || initialLoading}
                />
                <button type="submit" className="flux-send" disabled={!input.trim() || isProcessing || initialLoading} aria-label="Send message">
                  <Send size={18} />
                </button>
              </div>
              <div className="flux-composer__hint">Enter to send · Shift+Enter for a new line · Responses respect authorized access</div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
}