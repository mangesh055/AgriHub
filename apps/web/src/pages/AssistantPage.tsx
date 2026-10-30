import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { api } from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        `🌾 **Namaste Ramesh!** I am your **AgriHub Agronomist AI**, connected directly to your **4.5-acre Krishna Agri Fields** in Haveli, Pune.\n\n` +
        `I am actively tracking your **Soybean (Flowering stage)**, your **34% soil moisture IoT reading**, and today's **35mm heavy rain alert**.\n\n` +
        `What agricultural decision can I assist you with today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text?: string) {
    const query = text || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant('33333333-3333-3333-3333-333333333333', query);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving the latest agronomic data. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const promptChips = [
    'Should I spray pesticide today?',
    'Should I irrigate my soybean field today?',
    'Which mandi in Pune offers highest profit?',
    'How do I treat leaf spots on my crop?'
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--color-primary-light)',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            <Sparkles size={13} color="#10b981" />
            <span>Ground-Truth Contextual Agronomy</span>
          </div>
          <span className="live-pulse-dot" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-heading)' }}>
          AI Agricultural Decision Assistant
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Answers agronomic questions using your real-time sensor metrics, weather forecasts, and wholesale mandi price intelligence.
        </p>
      </div>

      {/* Chat History Box */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          marginBottom: '16px',
          border: '1px solid var(--border-card)'
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '12px',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%'
            }}
          >
            {m.role === 'assistant' && (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Bot size={20} color="#ffffff" />
              </div>
            )}

            <div
              style={{
                padding: '16px 20px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'var(--bg-card-hover)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.93rem',
                lineHeight: 1.65,
                border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'pre-line',
                boxShadow: m.role === 'user' ? '0 4px 16px rgba(16, 185, 129, 0.3)' : 'var(--shadow-sm)'
              }}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <User size={18} color="var(--color-primary-light)" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <Bot size={18} color="#ffffff" />
            </div>
            <span>Checking weather forecast, soil moisture telemetry, and crop phenology...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
        {promptChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            className="btn-secondary"
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              whiteSpace: 'nowrap',
              gap: '6px'
            }}
          >
            <Zap size={13} color="#fbbf24" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '12px' }}
      >
        <input
          type="text"
          placeholder="Ask about fertilizer dosages, irrigation, spraying, or mandi trends..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="form-input"
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.94rem'
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0 24px' }}>
          <Send size={18} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
