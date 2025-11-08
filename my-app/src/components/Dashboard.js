import React, { useEffect, useMemo, useState } from 'react';
import Transactions from './Transactions';
import Savings from './Savings';
import Reports from './Reports';

// Simple id generator
function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Core entities
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [syncLog, setSyncLog] = useState([]);

  // Draft forms
  const [categoryDraft, setCategoryDraft] = useState({ id: null, name: '', description: '', type: 'Expense' });
  const [budgetDraft, setBudgetDraft] = useState({ id: null, name: '', amount: '', period: 'Monthly', startDate: '', endDate: '', description: '', categoryId: '' });
  const [budgetError, setBudgetError] = useState('');

  // Backend URL
  const CATEGORY_API = process.env.REACT_APP_CATEGORY_API || "http://localhost:8081/api/categories";
  const BUDGET_API = process.env.REACT_APP_BUDGET_API || "http://localhost:8082/api/budgets";
  const TRANSACTION_API = process.env.REACT_APP_TRANSACTION_API || "http://localhost:8083/api/transactions";

  function normalizeCategory(apiObj) {
    if (!apiObj) return null;
    const id = apiObj.id ?? apiObj.categoryId ?? apiObj.category_id;
    const name = apiObj.name ?? apiObj.categoryName ?? apiObj.category_name;
    const description = apiObj.description ?? '';
    const type = apiObj.type ?? apiObj.categoryType ?? apiObj.category_type ?? 'Expense';
    return { id, name, description, type };
  }

  function normalizeBudget(apiObj) {
    if (!apiObj) return null;
    const id = apiObj.id ?? apiObj.budgetId ?? apiObj.budget_id;
    const name = apiObj.name ?? apiObj.budgetName ?? apiObj.budget_name ?? apiObj.title;
    const amount = (apiObj.amount ?? apiObj.budgetAmount ?? apiObj.budget_amount ?? 0) * 1;
    const period = apiObj.period ?? apiObj.budgetPeriod ?? apiObj.budget_period ?? 'Monthly';
    const description = apiObj.description ?? apiObj.Budget_description ?? apiObj.budgetDescription ?? apiObj.budget_description ?? '';
    const startDate = apiObj.startDate ?? apiObj.start_date ?? '';
    const endDate = apiObj.endDate ?? apiObj.end_date ?? '';
    const userIdRaw = apiObj.userId ?? apiObj.user_id ?? null;
    const categoryIdRaw = apiObj.categoryId ?? apiObj.category_id ?? null;
    const userId = userIdRaw != null && userIdRaw !== '' ? Number(userIdRaw) : null;
    const categoryId = categoryIdRaw != null && categoryIdRaw !== '' ? Number(categoryIdRaw) : null;
    return { id, name, amount: isNaN(amount) ? 0 : amount, period, description, startDate, endDate, userId, categoryId };
  }

  function normalizeTransaction(apiObj) {
    if (!apiObj) return null;
    const id = apiObj.id ?? apiObj.transactionId ?? apiObj.transaction_id;
    const amountRaw = apiObj.amount ?? 0;
    const amount = typeof amountRaw === 'string' ? parseFloat(amountRaw) : Number(amountRaw || 0);
    const transactionType = apiObj.transactionType ?? apiObj.type ?? '';
    const categoryIdRaw = apiObj.categoryId ?? apiObj.category_id ?? null;
    const categoryId = categoryIdRaw != null && categoryIdRaw !== '' ? Number(categoryIdRaw) : null;
    const transactionDate = apiObj.transactionDate ?? apiObj.date ?? '';
    return { id, amount: isNaN(amount) ? 0 : amount, transactionType, categoryId, transactionDate };
  }

  // Load categories from backend
  useEffect(() => {
    fetch(CATEGORY_API)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setCategories(data.map(normalizeCategory).filter(Boolean)) : setCategories([]))
      .catch(() => console.warn("⚠️ Could not fetch categories from backend"));
  }, []);

  // CRUD: Budgets (via backend) - load budgets filtered by current user
  useEffect(() => {
    // Handle nested user object structure
    const userObj = user?.user || user;
    const userId = userObj?.user_id || userObj?.id || userObj?.userId || user?.id || user?.user_id || user?.userId;
    console.log("👤 Current user object:", user);
    console.log("🔑 Extracted user ID:", userId);
    
    if (!userId) {
      console.warn("⚠️ No user ID available, cannot fetch budgets");
      console.warn("⚠️ User object structure:", JSON.stringify(user, null, 2));
      setBudgets([]);
      return;
    }
    
    const budgetUrl = `${BUDGET_API}?user_id=${userId}`;
    console.log("🔍 Fetching budgets from:", budgetUrl);
    
    // Fetch budgets filtered by user_id (matching your backend controller parameter)
    fetch(budgetUrl)
      .then(res => {
        console.log("📡 Budget API response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("📦 Raw budget data received:", data);
        const items = Array.isArray(data) ? data.map(normalizeBudget).filter(Boolean) : [];
        console.log("✅ Normalized budgets:", items);
        setBudgets(items);
      })
      .catch(err => {
        console.error("❌ Error fetching budgets:", err);
        console.warn("⚠️ Could not fetch budgets from backend");
      });
  }, [user]);

  // Load transactions for current user
  useEffect(() => {
    const userObj = user?.user || user;
    const userId = userObj?.user_id || userObj?.id || userObj?.userId || user?.id || user?.user_id || user?.userId;
    if (!userId) {
      setTransactions([]);
      return;
    }
    fetch(`${TRANSACTION_API}/user/${userId}`)
      .then(res => res.json())
      .then(data => setTransactions(Array.isArray(data) ? data.map(normalizeTransaction).filter(Boolean) : []))
      .catch(() => setTransactions([]));
  }, [user]);

  // Log helper
  function logSync(action, entity, payload, status = 'pending') {
    const entry = {
      id: generateId('sync'),
      timestamp: new Date().toISOString(),
      action,
      entity,
      payload,
      status
    };
    setSyncLog(prev => [entry, ...prev]);
  }

  // CRUD: Categories (via backend)

  async function upsertCategory() {
    const name = categoryDraft.name.trim();
    if (!name) return;

    const desc = categoryDraft.description.trim();
    const type = categoryDraft.type || 'Expense';
    const payload = {
      name,
      description: desc,
      type,
      categoryName: name,
      categoryType: type,
      categoryDescription: desc,
      category_name: name,
      category_type: type,
      category_description: desc
    };

    try {
      if (categoryDraft.id) {
        const res = await fetch(`${CATEGORY_API}/${categoryDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let updated = null;
        try { updated = await res.json(); } catch (_) {}
        const normalizedRaw = normalizeCategory(updated) || {};
        const normalized = {
          id: normalizedRaw.id ?? categoryDraft.id,
          name: normalizedRaw.name ?? name,
          description: normalizedRaw.description ?? desc,
          type: normalizedRaw.type ?? type
        };
        setCategories(prev => prev.map(c => c.id === normalized.id ? normalized : c));
        logSync('update', 'category', normalized, res.ok ? 'ok' : 'pending');
      } else {
        const res = await fetch(CATEGORY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        const normalizedRaw = normalizeCategory(created) || {};
        const normalized = {
          id: normalizedRaw.id,
          name: normalizedRaw.name ?? name,
          description: normalizedRaw.description ?? desc,
          type: normalizedRaw.type ?? type
        };
        setCategories(prev => [normalized, ...prev]);
        logSync('create', 'category', normalized, res.ok ? 'ok' : 'pending');
      }
      setCategoryDraft({ id: null, name: '', description: '', type: 'Expense' });
    } catch (err) {
      console.error('Error saving category:', err);
    }
  }

  async function upsertBudget() {
    const name = (budgetDraft.name || '').trim();
    if (!name) { setBudgetError('Name is required'); return; }
    const amount = parseFloat(budgetDraft.amount || '0');
    if (!(amount > 0)) { setBudgetError('Amount must be greater than 0'); return; }
    const desc = (budgetDraft.description || '').trim();
    const period = budgetDraft.period || 'Monthly';
    const startDate = budgetDraft.startDate || '';
    const endDate = budgetDraft.endDate || '';
    const categoryId = budgetDraft.categoryId || null;
    
    // Handle nested user object structure
    const userObj = user?.user || user;
    const userIdFromApp = userObj?.user_id || userObj?.id || userObj?.userId || user?.id || user?.user_id || user?.userId;
    const effectiveUserId = userIdFromApp;
    
    const categoryIdNum = categoryId ? Number(categoryId) : null;
    const effectiveUserIdNum = effectiveUserId ? Number(effectiveUserId) : null;
    const validPeriods = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    if (!validPeriods.includes(period)) { setBudgetError('Invalid period'); return; }
    if (!startDate || !endDate) { setBudgetError('Start and end dates are required'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setBudgetError('End date must be after start date'); return; }
    if (!categoryId) { setBudgetError('Please select a category'); return; }
    if (!effectiveUserId) { setBudgetError('User is not logged in properly. Please re-login.'); return; }

    const payload = {
      name,
      amount,
      period,
      description: desc,
      startDate,
      endDate,
      userId: effectiveUserIdNum,
      categoryId: categoryIdNum,
      budgetName: name,
      budgetAmount: amount,
      budgetPeriod: period,
      budgetDescription: desc,
      userID: effectiveUserIdNum,
      budgetUserId: effectiveUserIdNum,
      budgetCategoryId: categoryIdNum,
      budget_name: name,
      budget_amount: amount,
      budget_period: period,
      budget_description: desc,
      Budget_description: desc,
      start_date: startDate,
      end_date: endDate,
      user_id: effectiveUserIdNum,
      category_id: categoryIdNum
    };

    try {
      setBudgetError('');
      if (budgetDraft.id) {
        const res = await fetch(`${BUDGET_API}/${budgetDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(budgetDraft.id),
            budgetId: Number(budgetDraft.id),
            budget_id: Number(budgetDraft.id),
            ...payload
          })
        });
        let updated = null;
        if (!res.ok) {
          const text = await res.text();
          setBudgetError(`Update failed: ${text || res.status}`);
        }
        try { updated = await res.json(); } catch (_) {}
        const normalizedRaw = normalizeBudget(updated) || {};
        const normalized = {
          id: normalizedRaw.id ?? budgetDraft.id,
          name: normalizedRaw.name ?? name,
          amount: normalizedRaw.amount ?? amount,
          period: normalizedRaw.period ?? period,
          description: normalizedRaw.description ?? desc,
          startDate: normalizedRaw.startDate ?? startDate,
          endDate: normalizedRaw.endDate ?? endDate,
          userId: normalizedRaw.userId ?? effectiveUserId,
          categoryId: normalizedRaw.categoryId ?? categoryId
        };
        if (res.ok) {
          setBudgets(prev => prev.map(b => b.id === normalized.id ? normalized : b));
          logSync('update', 'budget', normalized, 'ok');
        }
      } else {
        const res = await fetch(BUDGET_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text();
          setBudgetError(`Create failed: ${text || res.status}`);
        }
        const created = await res.json();
        const normalizedRaw = normalizeBudget(created) || {};
        const normalized = {
          id: normalizedRaw.id,
          name: normalizedRaw.name ?? name,
          amount: normalizedRaw.amount ?? amount,
          period: normalizedRaw.period ?? period,
          description: normalizedRaw.description ?? desc,
          startDate: normalizedRaw.startDate ?? startDate,
          endDate: normalizedRaw.endDate ?? endDate,
          userId: normalizedRaw.userId ?? effectiveUserId,
          categoryId: normalizedRaw.categoryId ?? categoryId
        };
        if (res.ok) {
          setBudgets(prev => [normalized, ...prev]);
          logSync('create', 'budget', normalized, 'ok');
        }
      }
      setBudgetDraft({ id: null, name: '', amount: '', period: 'Monthly', startDate: '', endDate: '', description: '', categoryId: '' });
    } catch (err) {
      console.error('Error saving budget:', err);
      setBudgetError('Network or server error');
    }
  }

  function editBudget(b) {
    const normalized = normalizeBudget(b) || b;
    setBudgetDraft({
      id: normalized.id || null,
      name: normalized.name || '',
      amount: String(normalized.amount ?? ''),
      period: normalized.period || 'Monthly',
      startDate: normalized.startDate || '',
      endDate: normalized.endDate || '',
      description: normalized.description || '',
      categoryId: normalized.categoryId || ''
    });
  }

  async function deleteBudget(id) {
    try {
      await fetch(`${BUDGET_API}/${id}`, { method: 'DELETE' });
      setBudgets(prev => prev.filter(b => b.id !== id));
      logSync('delete', 'budget', { id }, 'ok');
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  }

  function editCategory(c) {
    const normalized = normalizeCategory(c) || c;
    setCategoryDraft({
      id: normalized.id || null,
      name: normalized.name || '',
      description: normalized.description || '',
      type: normalized.type || 'Expense'
    });
  }

  async function deleteCategory(id) {
    try {
      await fetch(`${CATEGORY_API}/${id}`, {
        method: 'DELETE',
      });
      setCategories(prev => prev.filter(c => c.id !== id));
      logSync('delete', 'category', { id }, 'ok');
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  }

  // Totals
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const budgetTotal = budgets.reduce((s, b) => s + (b.amount || 0), 0);
    return { income, expenses, budgetTotal, net: income - expenses };
  }, [transactions, budgets]);

  return (
    <div className="min-h-screen p-8" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0b1220 60%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Finance Dashboard</h1>
            <p className="text-blue-200">Name : {user?.email || user?.user?.email || user?.user?.username || 'Guest'}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'categories', label: 'Categories' },
            { key: 'budgets', label: 'Budgets' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'savings', label: 'Savings' },
            { key: 'reports', label: 'Reports' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === t.key ? 'text-white' : 'text-blue-200'}`}
              style={{
                background: activeTab === t.key ? 'linear-gradient(90deg,#06b6d4,#7c3aed)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
            <div className="text-blue-200 mb-6">Track and manage your finances effectively. Here's a quick snapshot:</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Income */}
              <div className="p-4 rounded-xl bg-white/5 border border-blue-900">
                <div className="text-blue-300 text-sm">Total Income</div>
                <div className="text-white font-bold text-2xl">${totals.income.toFixed(2)}</div>
              </div>
              {/* Total Expenses */}
              <div className="p-4 rounded-xl bg-white/5 border border-red-900">
                <div className="text-blue-300 text-sm">Total Expenses</div>
                <div className="text-white font-bold text-2xl">${totals.expenses.toFixed(2)}</div>
              </div>
              {/* Net Balance */}
              <div className="p-4 rounded-xl bg-white/5 border border-green-900">
                <div className="text-blue-300 text-sm">Net Balance</div>
                <div className="text-white font-bold text-2xl">${totals.net.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Total Budget */}
              <div className="p-4 rounded-xl bg-white/5 border border-purple-900">
                <div className="text-blue-300 text-sm">Total Budget Allocated</div>
                <div className="text-white font-bold text-2xl">${totals.budgetTotal.toFixed(2)}</div>
              </div>
              {/* Categories Count */}
              <div className="p-4 rounded-xl bg-white/5 border border-blue-600">
                <div className="text-blue-300 text-sm">Categories</div>
                <div className="text-white font-bold text-2xl">{categories.length}</div>
              </div>
              {/* Transactions Count */}
              <div className="p-4 rounded-xl bg-white/5 border border-yellow-600">
                <div className="text-blue-300 text-sm">Transactions</div>
                <div className="text-white font-bold text-2xl">{transactions.length}</div>
              </div>
            </div>

            {/* Quick tips */}
            <div className="mt-6 text-blue-200 text-sm">
              Keep track of your expenses, set realistic budgets, and save smartly. Your financial health at a glance!
            </div>
          </div>
        )}


        {/* Categories */}
        {activeTab === 'categories' && (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-3">Add / Edit Category</h3>
              <div className="space-y-3">
                <input value={categoryDraft.name} onChange={e => setCategoryDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                <input value={categoryDraft.description} onChange={e => setCategoryDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                <select value={categoryDraft.type} onChange={e => setCategoryDraft(d => ({ ...d, type: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white">
                  <option className="bg-slate-900" value="Income">Income</option>
                  <option className="bg-slate-900" value="Expense">Expense</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={upsertCategory} className="px-4 py-2 rounded text-white" style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }}>{categoryDraft.id ? 'Update' : 'Create'}</button>
                  {categoryDraft.id && <button onClick={() => setCategoryDraft({ id: null, name: '', description: '', type: 'Expense' })} className="px-4 py-2 rounded text-blue-200 border border-blue-900">Cancel</button>}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-3">Categories</h3>
              <ul className="divide-y divide-blue-900/50">
                {categories.map(c => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{c.name}</div>
                      <div className="text-blue-300 text-sm">{c.type} • {c.description || '—'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editCategory(c)} className="px-3 py-1 text-xs rounded border border-blue-900 text-blue-200">Edit</button>
                      <button onClick={() => deleteCategory(c.id)} className="px-3 py-1 text-xs rounded bg-red-600 text-white">Delete</button>
                    </div>
                  </li>
                ))}
                {categories.length === 0 && <li className="py-3 text-blue-300">No categories yet.</li>}
              </ul>
            </div>
          </section>
        )}

        {/* Budgets */}
        {activeTab === 'budgets' && (
          <section className="grid lg:grid-cols-3 gap-4">
            {/* Create / Edit */}
            <div className="p-4 rounded-2xl lg:col-span-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-3">Add / Edit Budget</h3>
              <div className="space-y-3">
                <input value={budgetDraft.name} onChange={e => setBudgetDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                <input value={budgetDraft.amount} onChange={e => setBudgetDraft(d => ({ ...d, amount: e.target.value }))} placeholder="Amount" type="number" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                <select value={budgetDraft.period} onChange={e => setBudgetDraft(d => ({ ...d, period: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white">
                  <option className="bg-slate-900" value="Daily">Daily</option>
                  <option className="bg-slate-900" value="Weekly">Weekly</option>
                  <option className="bg-slate-900" value="Monthly">Monthly</option>
                  <option className="bg-slate-900" value="Yearly">Yearly</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={budgetDraft.startDate} onChange={e => setBudgetDraft(d => ({ ...d, startDate: e.target.value }))} placeholder="Start Date" type="date" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                  <input value={budgetDraft.endDate} onChange={e => setBudgetDraft(d => ({ ...d, endDate: e.target.value }))} placeholder="End Date" type="date" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                </div>
                <select value={budgetDraft.categoryId} onChange={e => setBudgetDraft(d => ({ ...d, categoryId: e.target.value }))} className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white">
                  <option className="bg-slate-900" value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} className="bg-slate-900" value={c.id}>{c.name}</option>
                  ))}
                </select>
                <textarea value={budgetDraft.description} onChange={e => setBudgetDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" rows="3" className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white" />
                <div className="flex gap-2">
                  <button onClick={upsertBudget} className="px-4 py-2 rounded text-white" style={{ background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }}>{budgetDraft.id ? 'Update' : 'Create'}</button>
                  {budgetDraft.id && <button onClick={() => setBudgetDraft({ id: null, name: '', amount: '', period: 'Monthly', startDate: '', endDate: '', description: '', categoryId: '' })} className="px-4 py-2 rounded text-blue-200 border border-blue-900">Cancel</button>}
                </div>
                {budgetError && <div className="text-red-300 text-sm">{budgetError}</div>}
              </div>
            </div>

            {/* Charts */}
            <div className="p-4 rounded-2xl lg:col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-3">Budget Distribution</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Donut: distribution by amount */}
                <div className="flex flex-col items-center justify-center">
                  <svg width="220" height="220" viewBox="0 0 42 42" className="mb-3">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    {(() => {
                      const total = budgets.reduce((s, b) => s + (b.amount || 0), 0) || 1;
                      let cumulative = 0;
                      const colors = ['#06b6d4', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
                      return budgets.map((b, i) => {
                        const value = (b.amount || 0) / total;
                        const start = cumulative;
                        const end = cumulative + value;
                        cumulative = end;
                        const dash = `${value * 100} ${100 - value * 100}`;
                        const rotate = start * 360;
                        return (
                          <circle key={b.id || i} cx="21" cy="21" r="15.915" fill="transparent" stroke={colors[i % colors.length]} strokeWidth="6" strokeDasharray={dash} transform={`rotate(${rotate} 21 21)`} />
                        );
                      });
                    })()}
                  </svg>
                  <div className="text-blue-200 text-sm">Sum: ${budgets.reduce((s,b)=>s+(b.amount||0),0).toFixed(2)}</div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 gap-2 content-start">
                  {budgets.map((b, i) => (
                    <div key={b.id || i} className="flex items-center gap-2">
                      <span style={{ width: 12, height: 12, borderRadius: 3, display: 'inline-block', background: ['#06b6d4','#7c3aed','#22c55e','#f59e0b','#ef4444','#3b82f6'][i % 6] }} />
                      <span className="text-white text-sm font-semibold">{b.name}</span>
                      <span className="text-blue-300 text-sm">${(b.amount||0).toFixed(2)}</span>
                    </div>
                  ))}
                  {budgets.length === 0 && <div className="text-blue-300">No budgets yet.</div>}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-6 mb-3">Budgets</h3>
              <ul className="divide-y divide-blue-900/50">
                {budgets.map(b => {
                  const start = b.startDate ? new Date(b.startDate) : null;
                  const end = b.endDate ? new Date(b.endDate) : null;
                  const now = new Date();
                  let progress = 0;
                  if (start && end && end > start) {
                    progress = Math.min(1, Math.max(0, (now - start) / (end - start)));
                  }
                  const relatedTx = transactions.filter(t => {
                    const catMatch = (t.categoryId || t.category_id) === (b.categoryId || b.category_id);
                    if (!catMatch) return false;
                    if (!t.transactionDate || !start || !end) return catMatch;
                    const d = new Date(t.transactionDate);
                    return !isNaN(d) && d >= start && d <= end;
                  });
                  const used = relatedTx.filter(t => (t.transactionType || '').toLowerCase() !== 'income').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
                  const received = relatedTx.filter(t => (t.transactionType || '').toLowerCase() === 'income').reduce((s, t) => s + (t.amount || 0), 0);
                  const netUsed = Math.max(0, used - received);
                  const budgetAmount = Number(b.amount || 0);
                  const remaining = Math.max(0, budgetAmount - netUsed);
                  const usedPercent = budgetAmount > 0 ? Math.min(100, Math.max(0, (netUsed / budgetAmount) * 100)) : 0;
                  return (
                    <li key={b.id} className="py-4 grid md:grid-cols-3 gap-4 md:items-center">
                      <div>
                        <div className="text-white font-semibold text-base">{b.name}</div>
                        <div className="text-blue-300 text-sm">Budget: <span className="text-white font-semibold">${(b.amount||0).toFixed(2)}</span> • {b.period}</div>
                        <div className="text-blue-300 text-xs">Category: {categories.find(c => c.id === (b.categoryId || b.category_id))?.name || '—'}</div>
                        <div className="text-blue-300 text-xs">{b.startDate || '—'} → {b.endDate || '—'}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 rounded text-xs border border-blue-900 bg-white/5 text-blue-200">Used: <span className="text-white font-semibold">${used.toFixed(2)}</span></span>
                          <span className="px-2 py-1 rounded text-xs border border-emerald-900 bg-emerald-500/10 text-emerald-300">Received: <span className="text-white font-semibold">${received.toFixed(2)}</span></span>
                          <span className="px-2 py-1 rounded text-xs border border-purple-900 bg-purple-500/10 text-purple-200">Remaining: <span className="text-white font-semibold">${remaining.toFixed(2)}</span></span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                            <span>Usage</span>
                            <span>{Math.round(usedPercent)}%</span>
                          </div>
                          <div className="h-2 rounded bg-white/10 overflow-hidden">
                            <div className="h-2" style={{ width: `${Math.round(usedPercent)}%`, background: 'linear-gradient(90deg,#ef4444,#7c3aed)' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <svg width="72" height="72" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="url(#grad)" strokeWidth="6" strokeDasharray={`${Math.round(progress*100)} ${100-Math.round(progress*100)}`} />
                          <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="text-blue-200 text-sm">Time elapsed: <span className="text-white font-semibold">{Math.round(progress*100)}%</span></div>
                      </div>
                      <div className="flex gap-2 md:justify-end">
                        <button onClick={() => editBudget(b)} className="px-3 py-1 text-xs rounded border border-blue-900 text-blue-200">Edit</button>
                        <button onClick={() => deleteBudget(b.id)} className="px-3 py-1 text-xs rounded bg-red-600 text-white">Delete</button>
                      </div>
                    </li>
                  );
                })}
                {budgets.length === 0 && <li className="py-3 text-blue-300">No budgets to show.</li>}
              </ul>
            </div>
          </section>
        )}

        {/* Transactions */}
        {activeTab === 'transactions' && (
          <Transactions user={user} />
        )}
        {activeTab === 'savings' && (
          <Savings user={user} />
        )}
        {activeTab === 'reports' && (
          <Reports user={user} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;