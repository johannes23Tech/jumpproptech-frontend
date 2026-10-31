import { Send } from 'lucide-react';

export default function TenantMessages() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[70vh]">
      <div className="p-4 border-b border-gray-200 bg-ivory rounded-t-2xl">
        <h2 className="font-display text-xl font-bold">Messages</h2>
        <p className="text-xs text-gray-500">Chat with your Property Manager</p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <div className="text-center text-xs text-gray-400 my-4">Today</div>
        
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-black shrink-0">PM</div>
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] text-sm">
            Hi Thato, just a reminder that rent for this month is due on Friday. Let me know if you have any issues.
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <div className="bg-charcoal text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] text-sm">
            Thanks for the reminder. I will drop off the cash on Thursday.
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex gap-2">
        <input type="text" placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-gold" />
        <button className="bg-gold text-black p-3 rounded-lg hover:opacity-90"><Send size={20} /></button>
      </div>
    </div>
  );
}