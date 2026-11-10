import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Bot } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { tenantId } = useParams(); // Gets the ID from the URL (if Landlord)
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [chatData, setChatData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'messages' | 'assistant'>('messages');
  const [faqs, setFaqs] = useState<{ id: string, question: string }[]>([]);
  const [assistantMessages, setAssistantMessages] = useState([
    { id: 0, sender: 'assistant' as const, text: 'Hi! I’m the FAQ Assistant. I can help with rent, maintenance, leases, passwords, and property information.' },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const assistantMessageId = useRef(1);

  const isTenant = user?.role === 'tenant';

  const loadMessages = async () => {
    try {
      const res = await api.getMessages(tenantId ? Number(tenantId) : undefined);
      
      // If backend returns an inbox (Landlord with no selected tenant)
      if (res && res.inbox) {
        setInbox(res.inbox);
        setChatData(null); // Reset chat
        return;
      }

      // If backend returns chat data
      if (res) {
        setMessages(res.messages);
        setChatData(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMessages();
    // Only poll if we are inside an active chat
    if (isTenant || tenantId) {
      const interval = setInterval(loadMessages, 3000); 
      return () => clearInterval(interval);
    }
  }, [tenantId, isTenant]);

  useEffect(() => {
    if (activeView !== 'assistant') return;

    let cancelled = false;
    api.getFaqBotQuestions()
      .then((res) => {
        if (!cancelled) setFaqs(res.faqs);
      })
      .catch((err) => {
        if (!cancelled) {
          setAssistantError(err instanceof Error ? err.message : 'Could not load FAQ suggestions.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeView]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantMessages, activeView]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !chatData || !chatData.other_id) return;
    
    await api.sendMessage({ 
      receiver_id: chatData.other_id, 
      tenant_id: chatData.tenant_id, 
      message: text 
    });
    setText('');
    loadMessages();
  };

  const askAssistant = async (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || assistantLoading) return;

    setAssistantError('');
    setAssistantInput('');
    setAssistantMessages((current) => [
      ...current,
      { id: assistantMessageId.current++, sender: 'user', text: trimmedQuestion },
    ]);
    setAssistantLoading(true);

    try {
      const res = await api.askFaqBot(trimmedQuestion);
      setAssistantMessages((current) => [
        ...current,
        { id: assistantMessageId.current++, sender: 'assistant', text: res.answer },
      ]);
    } catch (err) {
      setAssistantError(err instanceof Error ? err.message : 'The FAQ Assistant could not respond. Please try again.');
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void askAssistant(assistantInput);
  };

  const viewSwitcher = (
    <div className="flex gap-2 mb-4" role="tablist" aria-label="Messages and FAQ assistant">
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'messages'}
        onClick={() => setActiveView('messages')}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${activeView === 'messages' ? 'bg-charcoal text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gold'}`}
      >
        <MessageSquare size={16} /> Messages
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'assistant'}
        onClick={() => setActiveView('assistant')}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${activeView === 'assistant' ? 'bg-charcoal text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gold'}`}
      >
        <Bot size={16} /> FAQ Assistant
      </button>
    </div>
  );

  if (activeView === 'assistant') {
    return (
      <div className="max-w-4xl mx-auto">
        {viewSwitcher}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[75vh]">
          <div className="p-4 border-b border-gray-200 bg-ivory rounded-t-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">FAQ Assistant</h2>
              <p className="text-xs text-gray-500">Quick answers to common questions</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50" aria-live="polite">
            {assistantMessages.map((message) => {
              const isUser = message.sender === 'user';
              return (
                <div key={message.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-charcoal text-gold flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] text-sm ${isUser ? 'bg-gold text-black rounded-tr-none font-medium' : 'bg-white border border-gray-200 rounded-tl-none text-gray-800'}`}>
                    {message.text}
                  </div>
                </div>
              );
            })}
            {assistantLoading && <p className="text-sm text-gray-500">Assistant is thinking…</p>}
            {assistantError && <p className="text-sm text-red-600" role="alert">{assistantError}</p>}
            <div ref={bottomRef} />
          </div>

          {faqs.length > 0 && (
            <div className="px-4 pt-3 flex gap-2 overflow-x-auto border-t border-gray-100">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  disabled={assistantLoading}
                  onClick={() => void askAssistant(faq.question)}
                  className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-gold hover:text-black disabled:opacity-50"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleAssistantSubmit} className="p-4 bg-white rounded-b-2xl flex gap-2">
            <input
              type="text"
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              maxLength={500}
              placeholder="Ask a question..."
              aria-label="Ask the FAQ Assistant a question"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={!assistantInput.trim() || assistantLoading}
              aria-label="Send question"
              className="bg-gold text-black p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: LANDLORD INBOX (No tenantId selected)
  // ==========================================
  if (!isTenant && !tenantId) {
    return (
      <div>
        {viewSwitcher}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-display text-xl font-bold mb-4">Message Inbox</h2>
        <p className="text-xs text-gray-500 mb-6">Select a tenant to open a secure chat channel.</p>

        {inbox.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No tenants available to message.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inbox.map(t => (
              <div 
                key={t.id} 
                onClick={() => navigate(`/messages/${t.id}`)}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-gold hover:shadow-md transition-all bg-ivory-dark"
              >
                <div className="w-12 h-12 rounded-full bg-charcoal text-gold flex items-center justify-center font-bold text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-black">{t.name}</p>
                  <p className="text-xs text-gray-500">Unit {t.unit_number}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE CHAT (Tenant or Landlord)
  // ==========================================
  if (!chatData) return <div className="p-8 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {viewSwitcher}
      {/* Back button for Landlord to return to inbox */}
      {!isTenant && (
        <button onClick={() => navigate('/messages')} className="inline-flex items-center gap-2 text-gold font-bold mb-4 hover:underline">
          <ArrowLeft size={16} /> Back to Inbox
        </button>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[75vh]">
        <div className="p-4 border-b border-gray-200 bg-ivory rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl font-bold">{chatData.chat_title}</h2>
            <p className="text-xs text-gray-500">Secure chat channel</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center font-bold text-black">
            {chatData.chat_title?.charAt(0) || 'U'}
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello!</p>}
          
          {messages.map((m) => {
            const isMe = m.sender_id === chatData.my_id;
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center text-xs font-bold shrink-0">U</div>}
                <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] text-sm ${isMe ? 'bg-gold text-black rounded-tr-none font-medium' : 'bg-white border border-gray-200 rounded-tl-none text-gray-800'}`}>
                  {m.message}
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-gray-700' : 'text-gray-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex gap-2">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-gold" 
          />
          <button type="submit" className="bg-gold text-black p-3 rounded-lg hover:opacity-90 transition-opacity"><Send size={20} /></button>
        </form>
      </div>
    </div>
  );
}