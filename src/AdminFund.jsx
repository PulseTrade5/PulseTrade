import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import TestTrading from './TestTrading';
import PnLChart from './PnLChart';

const COLORS = {
  bg: "#F4F6FA", surface: "#FFFFFF", surfaceBorder: "#E2E8F0",
  gold: "#C8920A", goldLight: "#FEF3C7", goldDim: "#D97706",
  green: "#059669", greenLight: "#ECFDF5",
  red: "#DC2626", redLight: "#FEF2F2",
  text: "#0F172A", muted: "#64748B",
};

export default function AdminFund({ userEmail }) {
  const [balance, setBalance] = useState(null);
  const [inputAmount, setInputAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [msg, setMsg] = useState("");

  const email = userEmail || "prabhat3300@gmail.com";

  const fetchFund = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('test_fund')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (!data && !error) {
      const { data: created } = await supabase
        .from('test_fund')
        .insert([{ user_email: email, balance: 0 }])
        .select()
        .single();
      data = created;
    }
    setBalance(data ? Number(data.balance) : 0);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('test_fund_transactions')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(10);
    setTransactions(data || []);
  };

  useEffect(() => {
    fetchFund();
    fetchTransactions();
  }, [email]);

  const logTransaction = async (type, amount, balanceAfter) => {
    await supabase.from('test_fund_transactions').insert([{
      user_email: email, type, amount, balance_after: balanceAfter,
    }]);
  };

  const updateBalance = async (newBalance, type, amount) => {
    setSaving(true);
    const { error } = await supabase
      .from('test_fund')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_email', email);

    if (!error) {
      await logTransaction(type, amount, newBalance);
      setBalance(newBalance);
      fetchTransactions();
      setMsg(type === 'add' ? `✅ ₹${amount.toLocaleString()} add ho gaya!` : type === 'withdraw' ? `➖ ₹${amount.toLocaleString()} nikal liya` : '🔄 Fund reset ho gaya');
      setTimeout(() => setMsg(''), 2500);
    }
    setSaving(false);
  };

  const handleAdd = () => {
    const amount = Number(inputAmount);
    if (!amount || amount <= 0) return;
    updateBalance(balance + amount, 'add', amount);
    setInputAmount("");
  };

  const handleWithdraw = () => {
    const amount = Number(inputAmount);
    if (!amount || amount <= 0 || amount > balance) return;
    updateBalance(balance - amount, 'withdraw', amount);
    setInputAmount("");
  };

  const handleReset = () => {
    if (!window.confirm('Fund ko 0 pe reset karna chahte ho?')) return;
    updateBalance(0, 'reset', balance);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', color: COLORS.muted, padding: '40px 0' }}>⏳ Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {msg && (
        <div style={{ backgroundColor: COLORS.greenLight, border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: COLORS.green }}>{msg}</div>
      )}

      {/* Wallet Card */}
      <div style={{
        borderRadius: 20, padding: '28px 24px', marginBottom: 16,
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        boxShadow: '0 8px 30px rgba(15,23,42,0.25)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#C8920A', fontWeight: 700, marginBottom: 8 }}>
          💵 TRADING WALLET
        </div>
        <div style={{ fontSize: 38, fontWeight: 900, color: '#FFF' }}>
          ₹{balance.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
          {email}
        </div>
      </div>

      {/* Add/Withdraw */}
      <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>MANAGE FUND</div>
        <input
          type="number"
          placeholder="Amount enter karein"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: COLORS.bg, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleAdd} disabled={saving} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', backgroundColor: COLORS.gold, color: '#FFF', cursor: 'pointer' }}>+ Add Fund</button>
          <button onClick={handleWithdraw} disabled={saving} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.red, cursor: 'pointer' }}>− Withdraw</button>
        </div>
        <button onClick={handleReset} disabled={saving} style={{ width: '100%', marginTop: 8, padding: '9px', fontSize: 12, fontWeight: 600, borderRadius: 10, border: `1.5px solid ${COLORS.surfaceBorder}`, backgroundColor: 'transparent', color: COLORS.muted, cursor: 'pointer' }}>Reset to ₹0</button>
      </div>

      {/* Trading */}
      <TestTrading userEmail={email} balance={balance} onBalanceChange={setBalance} />

      {/* Realized P&L Chart */}
      <PnLChart userEmail={email} />

      {/* Transaction History */}
      <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.surfaceBorder}`, borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, fontWeight: 700, marginBottom: 12 }}>RECENT ACTIVITY</div>
        {transactions.length === 0 ? (
          <p style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Koi transaction nahi hui abhi.</p>
        ) : transactions.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.surfaceBorder}` }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.type === 'add' ? COLORS.green : t.type === 'withdraw' ? COLORS.red : COLORS.muted }}>
                {t.type === 'add' ? '+ Add' : t.type === 'withdraw' ? '− Withdraw' : '🔄 Reset'}
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>₹{Number(t.amount).toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>
    </div>
  );
                         }
