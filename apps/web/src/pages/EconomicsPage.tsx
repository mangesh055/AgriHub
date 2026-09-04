import React, { useEffect, useState } from 'react';
import { Coins, Plus, DollarSign, PieChart, TrendingUp, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';

export const EconomicsPage: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profit, setProfit] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('FERTILIZERS');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [exp, prof] = await Promise.all([
        api.getExpenses('33333333-3333-3333-3333-333333333333'),
        api.getProfitSummary('33333333-3333-3333-3333-333333333333')
      ]);
      setExpenses(exp);
      setProfit(prof);
    } catch (err) {
      console.error('Error loading economics data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!newAmount) return;
    try {
      await api.addExpense('33333333-3333-3333-3333-333333333333', {
        category: newCategory,
        amount: parseFloat(newAmount),
        notes: newNotes,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      setNewAmount('');
      setNewNotes('');
      await loadData();
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Farm Expenses & Profit Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Track input operational expenditures across crop stages and project harvest net profit margins.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Record Farm Expense</span>
        </button>
      </div>

      {/* 1. Profit & Loss Summary Tiles */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Incurred Costs
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>
            ₹{profit?.totalExpenses?.toLocaleString('en-IN') ?? 0}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>4 Expense Categories Logged</span>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Projected Gross Harvest Revenue
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
            ₹{profit?.estimatedRevenue?.toLocaleString('en-IN') ?? 0}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Est. Yield: {profit?.estimatedYieldQuintals} Quintals (4.5 Ac)
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Projected Net Profit
          </span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
            ₹{profit?.netProfitProjected?.toLocaleString('en-IN') ?? 0}
          </div>
          <span className="badge badge-success">+{profit?.roiPercentage}% Estimated ROI</span>
        </div>
      </section>

      {/* 2. Itemized Expense Log */}
      <section className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Itemized Seasonal Input Expenses</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Date</th>
                <th style={{ padding: '12px 8px' }}>Category</th>
                <th style={{ padding: '12px 8px' }}>Description / Notes</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{e.date}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className="badge badge-info">{e.category.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{e.notes || '—'}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                    ₹{e.amount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>Log New Expense</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                >
                  <option value="FERTILIZERS">Fertilizers & Nutrients</option>
                  <option value="PESTICIDES">Pesticides & Crop Protection</option>
                  <option value="SEEDS">Seeds & Propagation</option>
                  <option value="IRRIGATION_ELECTRICITY">Irrigation & Power Tariff</option>
                  <option value="LABOR">Labor & Weeding</option>
                  <option value="MACHINERY_FUEL">Tractor & Diesel Fuel</option>
                  <option value="TRANSPORT">Transport & Freight</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Amount in ₹
                </label>
                <input
                  type="number"
                  placeholder="e.g. 4500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Notes & Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bio-fungicide spray and labor"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Expense Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
