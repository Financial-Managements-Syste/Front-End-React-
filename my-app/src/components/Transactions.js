import React, { useEffect, useMemo, useState } from 'react';

function Transactions({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState({
    id: null,
    amount: '',
    transactionType: 'Expense',
    transactionDate: '',
    description: '',
    paymentMethod: 'Cash',
    categoryId: '',
  });
  const [error, setError] = useState('');

  const TRANSACTION_API = process.env.REACT_APP_TRANSACTION_API || 'http://localhost:8083/api/transactions';
  const CATEGORY_API = process.env.REACT_APP_CATEGORY_API || 'http://localhost:8081/api/categories';

  const userId = useMemo(() => {
    const u = user?.user || user;
    return u?.user_id || u?.id || u?.userId || user?.id || user?.user_id || user?.userId || null;
  }, [user]);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      return;
    }
    fetch(`${TRANSACTION_API}/user/${userId}`)
      .then(r => r.json())
      .then(data => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]));
  }, [userId]);

  useEffect(() => {
    fetch(CATEGORY_API)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr
          .map(c => ({
            id: c.id ?? c.categoryId ?? c.category_id,
            name: c.name ?? c.categoryName ?? c.category_name,
            type: c.type ?? c.categoryType ?? c.category_type
          }))
          .filter(x => x && x.id)
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        setCategories(normalized);
      })
      .catch(() => setCategories([]));
  }, []);

  function edit(t) {
    setDraft({
      id: t.transactionId ?? t.id ?? null,
      amount: String(t.amount ?? ''),
      transactionType: t.transactionType || 'Expense',
      transactionDate: t.transactionDate || '',
      description: t.description || '',
      paymentMethod: t.paymentMethod || 'Cash',
      categoryId: t.categoryId ?? t.category_id ?? '',
    });
  }

  async function remove(id) {
    try {
      await fetch(`${TRANSACTION_API}/delete/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => (t.transactionId ?? t.id) !== id));
    } catch (_) {}
  }

  async function save() {
    setError('');
    const amountNum = parseFloat(draft.amount || '0');
    const categoryIdNum = draft.categoryId ? Number(draft.categoryId) : null;
    if (!(amountNum !== 0)) { setError('Amount is required'); return; }
    if (!userId) { setError('Missing user'); return; }
    if (!categoryIdNum) { setError('Select category'); return; }

    const payload = {
      transactionId: draft.id ?? undefined,
      userId: Number(userId),
      categoryId: categoryIdNum,
      amount: amountNum,
      transactionType: draft.transactionType,
      transactionDate: draft.transactionDate,
      description: draft.description,
      paymentMethod: draft.paymentMethod,
    };

    try {
      if (draft.id) {
        const res = await fetch(`${TRANSACTION_API}/update/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updated = await res.json();
        setTransactions(prev => prev.map(t => ((t.transactionId ?? t.id) === (draft.id)) ? updated : t));
      } else {
        const res = await fetch(`${TRANSACTION_API}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const created = await res.json();
        setTransactions(prev => [created, ...prev]);
      }
      setDraft({ id: null, amount: '', transactionType: 'Expense', transactionDate: '', description: '', paymentMethod: 'Cash', categoryId: '' });
    } catch (e) {
      setError('Failed to save');
    }
  }

  const totalIncome = useMemo(() => transactions.filter(t => (t.transactionType || '').toLowerCase() === 'income').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => (t.transactionType || '').toLowerCase() !== 'income').reduce((s, t) => s + Math.abs(t.amount || 0), 0), [transactions]);
  const countTotal = useMemo(() => transactions.length, [transactions]);
  const countIncome = useMemo(() => transactions.filter(t => (t.transactionType || '').toLowerCase() === 'income').length, [transactions]);
  const countExpense = useMemo(() => transactions.filter(t => (t.transactionType || '').toLowerCase() !== 'income').length, [transactions]);
  const filteredCategories = useMemo(() => {
    const tt = (draft.transactionType || '').toLowerCase();
    if (!tt) return categories;
    return categories.filter(c => (c.type || '').toLowerCase() === (tt === 'income' ? 'income' : 'expense'));
  }, [categories, draft.transactionType]);

  return (
    <section className="grid lg:grid-cols-3 gap-4">
      {/* Left: Form */}
      <div className="p-5 rounded-2xl lg:col-span-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">Add / Edit Transaction</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-blue-300 text-xs mb-1">Amount</label>
            <input value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} placeholder="0.00" type="number" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-blue-300 text-xs mb-1">Type</label>
              <select value={draft.transactionType} onChange={e => setDraft(d => ({ ...d, transactionType: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none">
                <option className="bg-slate-900" value="Income">Income</option>
                <option className="bg-slate-900" value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-300 text-xs mb-1">Date</label>
              <input value={draft.transactionDate} onChange={e => setDraft(d => ({ ...d, transactionDate: e.target.value }))} placeholder="Date" type="date" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-blue-300 text-xs mb-1">Category</label>
            <select value={draft.categoryId} onChange={e => setDraft(d => ({ ...d, categoryId: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none">
              <option className="bg-slate-900" value="">Select Category</option>
              {filteredCategories.map(c => (
                <option key={c.id} className="bg-slate-900" value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="text-blue-400/70 text-xs mt-1">Filtered by type: {draft.transactionType}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-blue-300 text-xs mb-1">Payment Method</label>
              <input value={draft.paymentMethod} onChange={e => setDraft(d => ({ ...d, paymentMethod: e.target.value }))} placeholder="Cash / Card / Transfer" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-blue-300 text-xs mb-1">Description</label>
              <input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Optional note" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 rounded text-white shadow-sm hover:opacity-95 transition" style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }}>{draft.id ? 'Update' : 'Create'}</button>
            {draft.id && <button onClick={() => setDraft({ id: null, amount: '', transactionType: 'Expense', transactionDate: '', description: '', paymentMethod: 'Cash', categoryId: '' })} className="px-4 py-2 rounded text-blue-200 border border-blue-900 hover:bg-white/5 transition">Cancel</button>}
          </div>
          {error && <div className="text-red-300 text-sm">{error}</div>}
        </div>
      </div>

      {/* Right: Stats + List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(124,58,237,0.12))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-blue-200 text-xs">Total Transactions</div>
            <div className="text-white text-2xl font-bold mt-1">{countTotal}</div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(6,182,212,0.10))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-blue-200 text-xs">Income</div>
            <div className="text-white text-2xl font-bold mt-1">{countIncome} <span className="text-blue-300 text-sm ml-1">${totalIncome.toFixed(2)}</span></div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(124,58,237,0.08))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-blue-200 text-xs">Expense</div>
            <div className="text-white text-2xl font-bold mt-1">{countExpense} <span className="text-blue-300 text-sm ml-1">${totalExpense.toFixed(2)}</span></div>
          </div>
        </div>

        {/* List */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Transactions</h3>
            <div className="text-blue-300 text-sm">Income: ${totalIncome.toFixed(2)} • Expenses: ${totalExpense.toFixed(2)}</div>
          </div>
          <ul className="divide-y divide-blue-900/50">
            {transactions.map(t => {
              const isIncome = (t.transactionType || '').toLowerCase() === 'income';
              const categoryName = categories.find(c => c.id === (t.categoryId ?? t.category_id))?.name || '—';
              return (
                <li key={t.transactionId ?? t.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow" style={{ background: isIncome ? 'linear-gradient(135deg,#22c55e,#06b6d4)' : 'linear-gradient(135deg,#ef4444,#7c3aed)' }}>
                      {isIncome ? '+' : '-'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">${(t.amount || 0).toFixed(2)} <span className={`ml-2 px-2 py-0.5 rounded text-xs ${isIncome ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{t.transactionType}</span></div>
                      <div className="text-blue-300 text-sm mt-0.5">{categoryName} • <span className="text-blue-400/80">{t.paymentMethod || '—'}</span></div>
                      {t.description && <div className="text-blue-400/80 text-xs mt-0.5">{t.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <span className="px-2 py-1 rounded text-xs bg-white/5 text-blue-200 border border-blue-900">{t.transactionDate || '—'}</span>
                    <button onClick={() => edit(t)} className="px-3 py-1 text-xs rounded border border-blue-900 text-blue-200 hover:bg-white/5 transition">Edit</button>
                    <button onClick={() => remove(t.transactionId ?? t.id)} className="px-3 py-1 text-xs rounded bg-red-600/90 hover:bg-red-600 text-white transition">Delete</button>
                  </div>
                </li>
              );
            })}
            {transactions.length === 0 && <li className="py-3 text-blue-300">No transactions yet.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Transactions;


