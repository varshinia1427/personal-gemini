import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles, Send, X, Bot, User as UserIcon, Lightbulb } from 'lucide-react';
import type { AgeGroup, JournalEntry, LanguageCode } from '../types';
import { apiAskGemini } from '../services/api';

interface AskGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  ageGroup: AgeGroup;
  language: LanguageCode;
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
  ageGroup,
  language,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'gemini',
      text:
        ageGroup === '3-6'
          ? "Hi there! I'm your friendly Journal Buddy. Ask me anything about the fun things you've drawn or shared!"
          : ageGroup === '7-12'
          ? "Hey Explorer! I'm here to help you remember your awesome adventures and questions. What would you like to know?"
          : ageGroup === '13-17'
          ? "Hey! I'm your private AI journal companion. Ask me anything about your entries, recurring patterns, or goals."
          : 'Welcome. I am your mindful AI journaling companion. Ask me any reflective question about your thoughts, emotional trends, or past entries.',
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

      const res = await apiAskGemini({
        question: q,
        entriesSummary,
        language,
        ageGroup,
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

  const samplePromptsByAge: Record<AgeGroup, string[]> = {
    '3-6': ['What was my happiest day?', 'Show me what I drew this week!'],
    '7-12': ['What was my biggest adventure recently?', 'What made me curious this week?'],
    '13-17': ['How has my stress or mood changed lately?', 'What goals did I mention for school?'],
    '18+': ['What themes have brought me the most calm?', 'Summarize my emotional trajectory this month.'],
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl h-[80vh] flex flex-col glass-panel rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  Ask Gemini About My Journal
                </h2>
                <p className="text-xs text-slate-500">
                  Private answers grounded in your {entries.length} personal entries
                </p>
              </div>
            </div>
            <button
              type="button"
              id="close-ask-gemini-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-slate-100/90 text-slate-800 border border-slate-200/60'
                        : 'bg-indigo-600 text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.themes && msg.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                        {msg.themes.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-semibold"
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
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Gemini is reading through your journal entries...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-6 py-2 bg-slate-50/70 border-t border-slate-200/50 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Prompts:
            </span>
            {samplePromptsByAge[ageGroup]?.map((promptText, pidx) => (
              <button
                key={pidx}
                type="button"
                onClick={() => handleAsk(promptText)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 whitespace-nowrap transition-colors"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200/80 bg-white/70">
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
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
              <button
                type="submit"
                id="send-ask-gemini-button"
                disabled={isLoading || !question.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 shrink-0 shadow-sm"
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
