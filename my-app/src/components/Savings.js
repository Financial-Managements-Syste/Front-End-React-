import React, { useEffect, useMemo, useState } from 'react';

function Savings({ user }) {
  const [goals, setGoals] = useState([]);
  const [draft, setDraft] = useState({
    id: null,
    goalName: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    status: 'Active'
  });
  const [error, setError] = useState('');

  const SAVINGS_API = process.env.REACT_APP_SAVINGS_API || 'http://localhost:8084/api/savings';

  const userId = useMemo(() => {
    const u = user?.user || user;
    return u?.user_id || u?.id || u?.userId || user?.id || user?.user_id || user?.userId || null;
  }, [user]);

  useEffect(() => {
    if (!userId) { setGoals([]); return; }
    fetch(`${SAVINGS_API}/user/${userId}`)
      .then(r => r.json())
      .then(data => setGoals(Array.isArray(data) ? data : []))
      .catch(() => setGoals([]));
  }, [userId]);

  const totalCollected = useMemo(() => {
    return goals.reduce((sum, g) => {
      const current = Number((g.currentAmount ?? g.current_amount) || 0);
      return sum + (isNaN(current) ? 0 : current);
    }, 0);
  }, [goals]);

  const accomplishedCount = useMemo(() => {
    return goals.filter(g => (g.status || '').toLowerCase() === 'completed' || Number((g.currentAmount ?? g.current_amount) || 0) >= Number((g.targetAmount ?? g.target_amount) || 0)).length;
  }, [goals]);

  function normalizeGoal(g) {
    return {
      id: g.id ?? g.goalId ?? g.goal_id,
      userId: g.userId ?? g.user_id,
      goalName: g.goalName ?? g.goal_name,
      targetAmount: g.targetAmount ?? g.target_amount,
      currentAmount: g.currentAmount ?? g.current_amount,
      targetDate: g.targetDate ?? g.target_date,
      status: g.status || 'Active'
    };
  }

  function edit(g) {
    const n = normalizeGoal(g);
    setDraft({
      id: n.id ?? null,
      goalName: n.goalName || '',
      targetAmount: String(n.targetAmount ?? ''),
      currentAmount: String(n.currentAmount ?? ''),
      targetDate: n.targetDate || '',
      status: n.status || 'Active'
    });
  }

  async function remove(id) {
    try {
      await fetch(`${SAVINGS_API}/${id}`, { method: 'DELETE' });
      setGoals(prev => prev.filter(g => (g.goalId ?? g.id) !== id));
    } catch (_) {}
  }

  async function save() {
    setError('');
    if (!userId) { setError('Missing user'); return; }
    const target = parseFloat(draft.targetAmount || '0');
    if (!(target > 0)) { setError('Target amount must be > 0'); return; }
    const current = parseFloat(draft.currentAmount || '0');
    if (current < 0) { setError('Current amount must be >= 0'); return; }

    const payload = {
      goalId: draft.id ?? undefined,
      userId: Number(userId),
      goalName: draft.goalName,
      targetAmount: target,
      currentAmount: current,
      targetDate: draft.targetDate,
      status: draft.status
    };

    try {
      if (draft.id) {
        const res = await fetch(`${SAVINGS_API}/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updated = await res.json();
        setGoals(prev => prev.map(g => ((g.goalId ?? g.id) === draft.id) ? updated : g));
      } else {
        const res = await fetch(`${SAVINGS_API}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const created = await res.json();
        setGoals(prev => [created, ...prev]);
      }
      setDraft({ id: null, goalName: '', targetAmount: '', currentAmount: '', targetDate: '', status: 'Active' });
    } catch (e) {
      setError('Failed to save');
    }
  }

  async function addFunds(id, amount) {
    try {
      const res = await fetch(`${SAVINGS_API}/${id}/add-funds?amount=${encodeURIComponent(amount)}`, { method: 'PUT' });
      const updated = await res.json();
      setGoals(prev => prev.map(g => ((g.goalId ?? g.id) === id) ? updated : g));
    } catch (_) {}
  }

  function progressOf(g) {
    const n = normalizeGoal(g);
    const t = Number(n.targetAmount || 0);
    const c = Number(n.currentAmount || 0);
    return t > 0 ? Math.min(100, Math.max(0, (c / t) * 100)) : 0;
  }

  return (
    <section className="grid lg:grid-cols-3 gap-4">
      {/* Form */}
      <div className="p-5 rounded-2xl lg:col-span-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-lg font-bold text-white mb-4">Add / Edit Savings Goal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-blue-300 text-xs mb-1">Goal Name</label>
            <input value={draft.goalName} onChange={e => setDraft(d => ({ ...d, goalName: e.target.value }))} placeholder="e.g., Emergency Fund" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-blue-300 text-xs mb-1">Target Amount</label>
              <input value={draft.targetAmount} onChange={e => setDraft(d => ({ ...d, targetAmount: e.target.value }))} placeholder="0.00" type="number" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
            </div>
            <div>
              <label className="block text-blue-300 text-xs mb-1">Current Amount</label>
              <input value={draft.currentAmount} onChange={e => setDraft(d => ({ ...d, currentAmount: e.target.value }))} placeholder="0.00" type="number" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-blue-300 text-xs mb-1">Target Date</label>
              <input value={draft.targetDate} onChange={e => setDraft(d => ({ ...d, targetDate: e.target.value }))} type="date" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
            </div>
            <div>
              <label className="block text-blue-300 text-xs mb-1">Status</label>
              <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white">
                <option className="bg-slate-900" value="Active">Active</option>
                <option className="bg-slate-900" value="Completed">Completed</option>
                <option className="bg-slate-900" value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 rounded text-white shadow-sm hover:opacity-95 transition" style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }}>{draft.id ? 'Update' : 'Create'}</button>
            {draft.id && <button onClick={() => setDraft({ id: null, goalName: '', targetAmount: '', currentAmount: '', targetDate: '', status: 'Active' })} className="px-4 py-2 rounded text-blue-200 border border-blue-900 hover:bg-white/5 transition">Cancel</button>}
          </div>
          {error && <div className="text-red-300 text-sm">{error}</div>}
        </div>
      </div>

      {/* List */}
      <div className="p-5 rounded-2xl lg:col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Savings Goals</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(6,182,212,0.10))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-blue-200 text-xs">Total Collected</div>
            <div className="text-white text-2xl font-bold mt-1">${totalCollected.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.10))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-blue-200 text-xs">Goals Accomplished</div>
            <div className="text-white text-2xl font-bold mt-1">{accomplishedCount}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(g => {
            const n = normalizeGoal(g);
            const pct = progressOf(n);
            const badgeClass = n.status === 'Completed'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-900'
              : n.status === 'Cancelled'
              ? 'bg-red-500/15 text-red-300 border-red-900'
              : 'bg-white/5 text-blue-200 border-blue-900';
            return (
              <div key={n.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold text-base">{n.goalName}</div>
                    <div className="text-blue-300 text-sm mt-0.5">Target: <span className="text-white font-semibold">${Number(n.targetAmount || 0).toFixed(2)}</span></div>
                    <div className="text-blue-300 text-sm">Current: <span className="text-white font-semibold">${Number(n.currentAmount || 0).toFixed(2)}</span></div>
                    <div className="text-blue-300 text-xs">Target Date: {n.targetDate || '—'}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs border whitespace-nowrap ${badgeClass}`}>{n.status}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 rounded bg-white/10 overflow-hidden">
                    <div className="h-2" style={{ width: `${Math.round(pct)}%`, background: 'linear-gradient(90deg,#22c55e,#06b6d4)' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => edit(n)} className="px-3 py-1 text-xs rounded border border-blue-900 text-blue-200 hover:bg-white/5 transition">Edit</button>
                  <button onClick={() => remove(n.id)} className="px-3 py-1 text-xs rounded bg-red-600/90 hover:bg-red-600 text-white transition">Delete</button>
                  <button onClick={() => addFunds(n.id, 50)} className="px-3 py-1 text-xs rounded bg-emerald-600/90 hover:bg-emerald-600 text-white transition">+ Add $50</button>
                </div>
              </div>
            );
          })}
        </div>
        {goals.length === 0 && <div className="text-blue-300">No savings goals yet.</div>}
      </div>
    </section>
  );
}

export default Savings;


