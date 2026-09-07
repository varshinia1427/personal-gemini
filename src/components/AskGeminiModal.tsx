import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, User as UserIcon, Lightbulb } from 'lucide-react';
import type { JournalEntry, LanguageCode } from '../types';
import { apiAskGemini } from '../services/api';

interface AskGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  language?: LanguageCode;
}

interface ChatMessage {
  sender: 'user' | 'gemini';
  text: string;
  themes?: string[];
  timestamp: string;
}

export const AskGeminiModal: React.FC<AskGeminiModalProps> = ({
  isOpen,
  onClose,
  entries,
  language = 'en',
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'gemini',
      text: 'Welcome. I am your mindful Sunviora AI journaling companion. Ask me any reflective question about your thoughts, emotional trends, or past entries.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || question).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const entriesSummary = entries.map((e) => ({
        title: e.title,
        content: e.content,
        mood: e.mood,
        date: new Date(e.created_at).toLocaleDateString(),
      }));

      // Multi-turn conversational memory for Sunviora
      const conversationHistory = messages
        .filter((_, idx) => idx > 0) // exclude initial system welcome message
        .slice(-10)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const res = await apiAskGemini({
        question: q,
        entriesSummary,
        language: (language as LanguageCode) || 'en',
        conversationHistory,
      });

      const aiMsg: ChatMessage = {
        sender: 'gemini',
        text: res.answer,
        themes: res.relatedThemes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Ask Gemini error:', err);
      const errorMsg: ChatMessage = {
        sender: 'gemini',
        text: 'I had trouble reviewing your journal entries just now. Please try asking again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'What themes have brought me the most calm?',
    'Summarize my emotional trajectory this month.',
    'What are common topics I reflect on?',
    'What patterns do you notice in my happiest entries?',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl h-[80vh] flex flex-col rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Ask Gemini About My Journal
                </h2>
                <p className="text-xs text-slate-400 font-light">
                  Private answers grounded in your {entries.length} personal entries
                </p>
              </div>
            </div>
            <button
              type="button"
              id="close-ask-gemini-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isAi = msg.sender === 'gemini';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    isAi ? '' : 'flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      isAi
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-white/5 text-slate-200 border border-white/10'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.themes && msg.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10">
                        {msg.themes.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-semibold"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        isAi ? 'text-slate-400' : 'text-indigo-200 text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-11">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Gemini is reading through your journal entries...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-6 py-2.5 bg-white/5 border-t border-white/10 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-300" /> Prompts:
            </span>
            {samplePrompts.map((promptText, pidx) => (
              <button
                key={pidx}
                type="button"
                onClick={() => handleAsk(promptText)}
                disabled={isLoading}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                id="ask-gemini-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your thoughts, moods, or memories..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
              <button
                type="submit"
                id="send-ask-gemini-button"
                disabled={isLoading || !question.trim()}
                className="p-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white transition-all disabled:opacity-40 shrink-0 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
