import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={18} color="#10b981" />
          <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Ground-Truth Contextual Agronomy
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>AI Agricultural Decision Assistant</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Answers agronomic questions using your real-time sensor metrics, weather forecast, and market prices.
        </p>
      </div>

      {/* Chat History Box */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '12px',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {m.role === 'assistant' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#ffffff" />
              </div>
            )}

            <div
              style={{
                padding: '14px 18px',
                borderRadius: '14px',
                background: m.role === 'user' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'pre-line'
              }}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="#ffffff" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="#ffffff" />
            </div>
            <span>Checking weather forecast and soil telemetry...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
        {promptChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-smooth)'
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          placeholder="Ask about fertilizer dosages, irrigation, spraying, or mandi trends..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: '#ffffff',
            fontSize: '0.94rem'
          }}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          <Send size={18} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
