import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  MessageSquare, X, Send, Sparkles, Bot, User, ArrowRight,
  RotateCcw, Minimize2, ExternalLink
} from 'lucide-react';

const SUGGESTIONS = [
  "What is the roster coverage for June 2026?",
  "Who manages EcoGlow Skincare?",
  "Show active conflicts",
  "Explain the 10 scheduling rules",
  "How does candidate backup ranking work?",
  "Who is Rahul Verma?"
];

export const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 **Hello! I'm your DataStraw Ops Copilot.**\n\nI have real-time access to your live MongoDB database, specialist rosters, brand calendars, and scheduling algorithms. You can ask me anything or click a question below to start!",
      suggestions: SUGGESTIONS
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Append user message
    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/message', { message: query });
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: res.data.reply,
          action: res.data.action,
          suggestions: res.data.suggestions || SUGGESTIONS
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "⚠️ Sorry, I encountered an error communicating with the operations server. Please ensure the backend is running.",
          suggestions: SUGGESTIONS
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: 'bot',
        text: "Chat cleared. What workforce question can I answer for you?",
        suggestions: SUGGESTIONS
      }
    ]);
  };

  // Helper to format basic markdown (bold, headers, bullets, code)
  const renderFormattedText = (txt) => {
    if (!txt) return null;
    const lines = txt.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h6 key={idx} style={{ fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.2rem' }}>
            {line.replace('### ', '')}
          </h6>
        );
      }
      // Bullet point
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const bulletText = line.substring(2);
        return (
          <div key={idx} style={{ paddingLeft: '1rem', position: 'relative', margin: '0.15rem 0' }}>
            <span style={{ position: 'absolute', left: '0.2rem', color: '#2563eb' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }} />
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} style={{ paddingLeft: '1rem', margin: '0.2rem 0' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          </div>
        );
      }
      // Empty line spacer
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.4rem' }} />;
      }
      return (
        <p key={idx} style={{ margin: '0.15rem 0' }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    });
  };

  const formatInline = (str) => {
    return str
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Code
      .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.75rem;color:#0f172a">$1</code>')
      // Italics
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1050,
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#1e40af',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(30, 64, 175, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, background-color 0.15s ease'
          }}
          title="Open DataStraw Ops Copilot"
        >
          <Bot size={26} />
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.2)',
            border: '1px solid #cbd5e1',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
                  DataStraw Ops Copilot
                </div>
                <div style={{ fontSize: '0.68rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                  Live Connected to Database
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleClear}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title="Clear Chat History"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: m.sender === 'user' ? '#1e40af' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  {m.sender === 'bot' ? renderFormattedText(m.text) : m.text}

                  {/* Direct Action Navigation Button */}
                  {m.action && (
                    <button
                      className="btn btn-sm btn-primary mt-2 d-flex align-items-center gap-1"
                      onClick={() => {
                        navigate(m.action.url);
                        setIsOpen(false);
                      }}
                      style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#2563eb', padding: '0.3rem 0.65rem' }}
                    >
                      {m.action.label} <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Suggestions Pills underneath bot reply */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginTop: '0.5rem',
                      maxWidth: '92%'
                    }}
                  >
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        disabled={loading}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1e40af',
                          border: '1px solid #bfdbfe',
                          borderRadius: '16px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                <Bot size={16} className="text-primary" />
                <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true" style={{ width: '8px', height: '8px' }}></span>
                <span>Copilot is analyzing workforce and schedule data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Ask anything about schedules, employees, brands, or rules..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ fontSize: '0.8rem', borderRadius: '6px' }}
              />
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ backgroundColor: '#1e40af', borderColor: '#1e40af', minWidth: '38px', borderRadius: '6px' }}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
              Press Enter to send • Queries live MongoDB database & scheduling engine
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
