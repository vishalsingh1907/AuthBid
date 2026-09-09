"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
  CornerDownLeft,
  Loader2
} from "lucide-react";

import { api } from "../lib/api";

interface CopilotResponseData {
  title: string;
  summary: string;
  evidence: string[];
  legal_statute: string;
  recommendation: string;
  disclaimer?: string;
}

interface Message {
  id: string;
  sender: "user" | "copilot";
  text?: string;
  data?: CopilotResponseData;
  timestamp: string;
}

interface CopilotDrawerProps {
  tenderId: string;
  selectedBidderId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const PRESET_QUERIES = [
  { label: "🔍 Collusion Ring 1", query: "Explain Collusion Ring 1 and evidence against B001, B003, B007" },
  { label: "🏢 Shell Company B007", query: "Why is Quantum Digital (B007) flagged as a shell company?" },
  { label: "🤝 Collusion Ring 2", query: "What are the ties between B005 and B009 in Ring 2?" },
  { label: "💰 L1 Evaluation", query: "Who is the lowest compliant bidder (L1) and recommended awardee?" },
  { label: "⚖️ GFR 175 Legal Grounds", query: "What are the legal grounds to disqualify cartels under GFR Rule 175?" },
];

export default function CopilotDrawer({
  tenderId,
  selectedBidderId,
  isOpen: controlledIsOpen,
  onClose,
}: CopilotDrawerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (onClose) onClose();
    setInternalIsOpen(false);
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = `authbid_copilot_${tenderId}_${selectedBidderId || "all"}`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "copilot",
      text: "Namaste Evaluation Officer. I am the GeM Vigilance & Legal AI Copilot. Ask me about cartel forensics, shell company indicators, L1 compliance standing, or statutory citations under GFR 2017 & Competition Act 2002.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Save chat history to localStorage
  const saveMessages = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMsgs));
    } catch {
      // ignore
    }
  };

  const clearChatHistory = () => {
    const defaultMsg: Message[] = [
      {
        id: "msg-welcome",
        sender: "copilot",
        text: "Namaste Evaluation Officer. I am the GeM Vigilance & Legal AI Copilot. Ask me about cartel forensics, shell company indicators, L1 compliance standing, or statutory citations under GFR 2017 & Competition Act 2002.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    saveMessages(defaultMsg);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedWithUser = [...messages, userMessage];
    saveMessages(updatedWithUser);
    setInputQuery("");
    setIsLoading(true);

    try {
      const json = await api.queryCopilot(textToSend, tenderId, selectedBidderId);
      if (json.success && json.data) {
        const copilotMsg: Message = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          data: json.data,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        saveMessages([...updatedWithUser, copilotMsg]);
      } else {
        const fallbackMsg: Message = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          text: "No conclusive evidence found for this query in the current tender dataset.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        saveMessages([...updatedWithUser, fallbackMsg]);
      }
    } catch (err: unknown) {
      console.error("Copilot query error:", err);
      const errorMsg: Message = {
        id: `cop-${Date.now()}`,
        sender: "copilot",
        text: "Vigilance intelligence endpoint unreachable or error encountered. Please check connectivity.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      saveMessages([...updatedWithUser, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group border border-blue-600"
          title="Open GeM AI Vigilance Copilot"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500/40 flex items-center justify-center">
            <Bot size={16} className="group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-bold tracking-wide">GeM Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight">GeM Vigilance Copilot</h3>
                  <span className="text-[10px] uppercase font-bold bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded">
                    AI Legal
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Statutory Cartel Forensics & GFR 2017 Advisor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                  onClick={clearChatHistory}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
                  title="Clear chat history"
                >
                  Clear
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {PRESET_QUERIES.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-full font-semibold transition shadow-2xs flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-blue-700 text-white rounded-br-none shadow-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs"
                  }`}
                >
                  {m.sender === "copilot" && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-[10px] font-bold text-amber-800 mb-2.5">
                      <Sparkles size={11} className="text-amber-600 flex-shrink-0" />
                      <span>AI-Generated Intelligence — Verify independently against statutory records</span>
                    </div>
                  )}

                  {m.text && <p className="font-medium whitespace-pre-wrap">{m.text}</p>}

                  {m.data && (
                    <div className="space-y-3">
                      <div className="border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Forensic Intelligence
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1.5">
                          {m.data.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">{m.data.summary}</p>
                      </div>

                      {/* Evidence List */}
                      {m.data.evidence && m.data.evidence.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                            Key Corroborating Evidence:
                          </p>
                          <ul className="space-y-1.5">
                            {m.data.evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Legal Statute Box */}
                      {m.data.legal_statute && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold mb-0.5">
                            <Scale size={13} className="text-amber-700" />
                            <span>Statutory Authority:</span>
                          </div>
                          <p className="text-[11px] leading-snug">{m.data.legal_statute}</p>
                        </div>
                      )}

                      {/* Recommendation Box */}
                      {m.data.recommendation && (
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold mb-0.5">
                            <Shield size={13} className="text-blue-700" />
                            <span>Recommended Officer Action:</span>
                          </div>
                          <p className="text-[11px] leading-snug font-medium">
                            {m.data.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit text-xs text-slate-500 shadow-xs">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span>Cross-referencing MCA21, GSTN, & GFR rules...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask vigilance copilot anything..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl disabled:opacity-40 transition"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
