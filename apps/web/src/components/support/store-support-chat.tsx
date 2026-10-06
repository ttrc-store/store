'use client';

import * as React from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { ChatMarkdownRenderer } from './chat-markdown-renderer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTION_CHIPS = [
  'Which motor driver fits N20 motors?',
  'What is the free shipping threshold?',
  'Is Cash on Delivery available?',
  'Tell me about the KL-F2 solenoid valve',
];

export function StoreSupportChat() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am Tamizh Tech's AI Engineering Assistant. Ask me about component specifications, kit compatibility, shipping, or store policies.",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const history = updatedMessages.slice(-6); // last 6 turns
      const response = await fetch('/api/ai/customer-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive response');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'No response returned.' },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.message ||
            'I am currently experiencing network delays. Please reach out to our team at support@ttrc.store or WhatsApp for immediate help.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button (Matching Platform Purple Theme) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#844AFB] hover:bg-[#6721F2] text-white rounded-full shadow-xl shadow-purple-900/30 transition-all transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          aria-label="Open AI Technical Assistant"
        >
          <div className="relative">
            <Bot size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#844AFB] animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">TTRC Support AI</span>
          <Sparkles size={14} className="text-purple-200 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header (Rich Dark Purple Header Matching Platform) */}
          <div className="p-3.5 bg-gradient-to-r from-[#1E0D45] via-[#2F146B] to-[#1E0D45] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#844AFB]/40 flex items-center justify-center border border-purple-400/30">
                <Bot size={18} className="text-purple-200" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold flex items-center gap-1.5 text-white">
                  TTRC Technical Support
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[10px] text-purple-200/80">Grounded in Live Catalog &amp; Policies</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FDFDFD] text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#844AFB]">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#844AFB] text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-2xs'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <ChatMarkdownRenderer content={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                    <User size={13} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-[#844AFB]">
                  <Bot size={13} />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-1.5">
              {SUGGESTION_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="text-[10px] font-medium text-slate-700 bg-white hover:bg-[#EEE8FA] hover:text-[#844AFB] border border-slate-200 rounded-full px-2.5 py-1 transition-colors text-left cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about parts, specs, orders..."
              className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#844AFB] focus:bg-white transition-all text-slate-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-[#844AFB] hover:bg-[#6721F2] text-white rounded-xl disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
