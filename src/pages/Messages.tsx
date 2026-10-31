import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { tenantId } = useParams(); // Gets the ID from the URL (if Landlord)
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [chatData, setChatData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // ==========================================
  // VIEW 1: LANDLORD INBOX (No tenantId selected)
  // ==========================================
  if (!isTenant && !tenantId) {
    return (
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
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE CHAT (Tenant or Landlord)
  // ==========================================
  if (!chatData) return <div className="p-8 text-center text-gray-500">Loading chat...</div>;

  return (
    <div className="max-w-4xl mx-auto">
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