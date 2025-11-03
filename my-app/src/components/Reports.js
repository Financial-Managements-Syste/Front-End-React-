import React, { useEffect, useState, useMemo } from 'react';

function Reports({ user }) {
  const [activeReport, setActiveReport] = useState('monthly-expenditure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Report data states
  const [monthlyExpenditure, setMonthlyExpenditure] = useState([]);
  const [budgetAdherence, setBudgetAdherence] = useState([]);
  const [savingsProgress, setSavingsProgress] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [savingsForecast, setSavingsForecast] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Filter states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [categoryType, setCategoryType] = useState('All');

  const REPORT_API = process.env.REACT_APP_REPORT_API || 'http://localhost:8095/api/reports';
  const CATEGORY_API = process.env.REACT_APP_CATEGORY_API || 'http://localhost:8081/api/categories';

  const userId = useMemo(() => {
    const u = user?.user || user;
    return u?.user_id || u?.id || u?.userId || user?.id || user?.user_id || user?.userId || null;
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    loadCurrentReport();
  }, [userId, activeReport, month, year, categoryType]);

  useEffect(() => {
    fetch(CATEGORY_API)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr
          .map(c => ({
            id: c.id ?? c.categoryId ?? c.category_id,
            name: c.name ?? c.categoryName ?? c.category_name,
            type: c.type ?? c.categoryType ?? c.category_type
          }))
          .filter(x => x && x.id);
        setCategories(normalized);
      })
      .catch(() => setCategories([]));
  }, []);

  function loadCurrentReport() {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    let url = '';
    
    switch(activeReport) {
      case 'monthly-expenditure':
        url = `${REPORT_API}/monthly-expenditure?userId=${userId}&month=${month}&year=${year}`;
        break;
      case 'budget-adherence':
        url = `${REPORT_API}/budget-adherence?userId=${userId}`;
        break;
      case 'savings-progress':
        url = `${REPORT_API}/savings-progress?userId=${userId}`;
        break;
      case 'category-distribution':
        url = `${REPORT_API}/category-distribution?userId=${userId}`;
        break;
      case 'savings-forecast':
        url = `${REPORT_API}/savings-forecast?userId=${userId}`;
        break;
      case 'summary':
        url = `${REPORT_API}/summary?userId=${userId}`;
        break;
      default:
        setLoading(false);
        return;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        switch(activeReport) {
          case 'monthly-expenditure':
            setMonthlyExpenditure(Array.isArray(data) ? data : []);
            break;
          case 'budget-adherence':
            setBudgetAdherence(Array.isArray(data) ? data : []);
            break;
          case 'savings-progress':
            setSavingsProgress(Array.isArray(data) ? data : []);
            break;
          case 'category-distribution':
            setCategoryDistribution(Array.isArray(data) ? data : []);
            break;
          case 'savings-forecast':
            setSavingsForecast(data);
            break;
          case 'summary':
            setSummary(data);
            break;
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading report:', err);
        setError('Failed to load report data');
        setLoading(false);
      });
  }

  const reportTabs = [
    { key: 'monthly-expenditure', label: 'Monthly Expenditure', description: 'Analyze spending patterns by month' },
    { key: 'budget-adherence', label: 'Budget Adherence', description: 'Track budget compliance' },
    { key: 'savings-progress', label: 'Savings Progress', description: 'Monitor savings goals' },
    { key: 'category-distribution', label: 'Category Distribution', description: 'View expense breakdown by category' },
    { key: 'savings-forecast', label: 'Savings Forecast', description: 'Predict future savings trends' },
    { key: 'summary', label: 'Summary Report', description: 'Complete overview' }
  ];

  return (
    <div className="space-y-6">
      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeReport === tab.key ? 'text-white' : 'text-blue-200'
            }`}
            style={{
              background: activeReport === tab.key ? 'linear-gradient(90deg,#06b6d4,#7c3aed)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-lg font-bold text-white mb-3">Filters</h3>
        {activeReport === 'monthly-expenditure' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-300 text-xs mb-1">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white"
              />
            </div>
            <div>
              <label className="block text-blue-300 text-xs mb-1">Year</label>
              <input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white"
              />
            </div>
          </div>
        )}
        {activeReport === 'category-distribution' && (
          <div>
            <label className="block text-blue-300 text-xs mb-1">Category Type</label>
            <select
              value={categoryType}
              onChange={e => setCategoryType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-transparent border border-blue-900 text-white"
            >
              <option className="bg-slate-900" value="All">All Categories</option>
              <option className="bg-slate-900" value="Expense">Expense Only</option>
              <option className="bg-slate-900" value="Income">Income Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-blue-200">Loading report...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-900">
          <div className="text-red-300">{error}</div>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && (
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Monthly Expenditure Report */}
          {activeReport === 'monthly-expenditure' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Monthly Expenditure Analysis</h3>
              {monthlyExpenditure.length === 0 ? (
                <div className="text-blue-300">No expenditure data available for this period.</div>
              ) : (
                <div className="space-y-4">
                  {monthlyExpenditure.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-semibold">{item.categoryName || item.category || 'Unknown'}</div>
                        <div className="text-emerald-300 font-bold">${Number(item.expenditure || item.amount || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-blue-300 text-sm">
                        {item.transactionCount || 0} transactions
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Budget Adherence Report */}
          {activeReport === 'budget-adherence' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Budget Adherence Tracking</h3>
              {budgetAdherence.length === 0 ? (
                <div className="text-blue-300">No budget adherence data available.</div>
              ) : (
                <div className="space-y-4">
                  {budgetAdherence.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-semibold">{item.budgetName || item.category || 'Unknown'}</div>
                        <div className={`font-bold ${Number(item.adherencePercentage || 0) > 100 ? 'text-red-400' : 'text-emerald-300'}`}>
                          {Number(item.adherencePercentage || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-300">Budget: </span>
                          <span className="text-white font-semibold">${Number(item.budgetedAmount || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-300">Spent: </span>
                          <span className="text-white font-semibold">${Number(item.actualAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-2 rounded bg-white/10 overflow-hidden">
                          <div 
                            className="h-2" 
                            style={{ 
                              width: `${Math.min(100, Number(item.adherencePercentage || 0))}%`,
                              background: Number(item.adherencePercentage || 0) > 100 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#22c55e,#06b6d4)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Savings Progress Report */}
          {activeReport === 'savings-progress' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Savings Goal Progress</h3>
              {savingsProgress.length === 0 ? (
                <div className="text-blue-300">No savings progress data available.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {savingsProgress.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-white font-semibold mb-2">{item.goalName || item.category || 'Unknown'}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-blue-300">Current: </span>
                          <span className="text-white font-semibold">${Number(item.currentAmount || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-300">Target: </span>
                          <span className="text-white font-semibold">${Number(item.targetAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-center mb-2">
                        <span className="text-emerald-300 font-bold text-lg">
                          {Number(item.progressPercentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded bg-white/10 overflow-hidden">
                        <div 
                          className="h-2" 
                          style={{ 
                            width: `${Math.min(100, Number(item.progressPercentage || 0))}%`,
                            background: 'linear-gradient(90deg,#22c55e,#06b6d4)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Distribution Report */}
          {activeReport === 'category-distribution' && (() => {
            // Filter categories based on selected type
            const filteredCategories = categoryDistribution.filter(item => {
              if (categoryType === 'All') return true;
              const category = categories.find(c => 
                (c.name || '').toLowerCase() === (item.categoryName || item.category || '').toLowerCase()
              );
              if (!category) return false;
              return (category.type || '').toLowerCase() === categoryType.toLowerCase();
            });
            
            const filteredTotal = filteredCategories.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 1;
            
            return (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Category-wise Expense Distribution</h3>
                {filteredCategories.length === 0 ? (
                  <div className="text-blue-300">No category distribution data available for {categoryType === 'All' ? 'this period' : categoryType.toLowerCase()}.</div>
                ) : (
                  <div className="space-y-4">
                    {filteredCategories.map((item, idx) => {
                      const colors = ['#06b6d4', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
                      const color = colors[idx % colors.length];
                      const percentage = (Number(item.amount || 0) / filteredTotal * 100).toFixed(1);
                      return (
                        <div key={idx} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: color }} />
                              <div className="text-white font-semibold">{item.categoryName || item.category || 'Unknown'}</div>
                            </div>
                            <div className="text-white font-bold">${Number(item.amount || 0).toFixed(2)} ({percentage}%)</div>
                          </div>
                          <div className="h-2 rounded bg-white/10 overflow-hidden">
                            <div 
                              className="h-2" 
                              style={{ 
                                width: `${percentage}%`,
                                background: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Savings Forecast Report */}
          {activeReport === 'savings-forecast' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Forecasted Savings Trends</h3>
              {savingsForecast ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-blue-300 text-sm mb-2">Current Savings</div>
                    <div className="text-white text-3xl font-bold mb-6">${Number(savingsForecast.currentSavings || 0).toFixed(2)}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-300">Monthly Contribution: </span>
                        <span className="text-white font-semibold">${Number(savingsForecast.monthlyContribution || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Projected (6 months): </span>
                        <span className="text-emerald-300 font-bold">${Number(savingsForecast.projectedSavings6Months || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Projected (12 months): </span>
                        <span className="text-emerald-300 font-bold">${Number(savingsForecast.projectedSavings12Months || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Interest Rate: </span>
                        <span className="text-white font-semibold">{Number(savingsForecast.interestRate || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-blue-300">No forecast data available.</div>
              )}
            </div>
          )}

          {/* Summary Report */}
          {activeReport === 'summary' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Complete Report Summary</h3>
              {summary ? (
                <div className="space-y-6">
                  {/* Monthly Expenditure Summary */}
                  {summary.monthlyExpenditure && summary.monthlyExpenditure.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Monthly Expenditure</h4>
                      <div className="grid gap-2">
                        {summary.monthlyExpenditure.map((item, idx) => (
                          <div key={idx} className="p-3 rounded bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.categoryName || 'Unknown'}</span>
                            <span className="text-emerald-300 font-semibold">${Number(item.expenditure || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget Adherence Summary */}
                  {summary.budgetAdherence && summary.budgetAdherence.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Budget Adherence</h4>
                      <div className="grid gap-2">
                        {summary.budgetAdherence.map((item, idx) => (
                          <div key={idx} className="p-3 rounded bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.budgetName || 'Unknown'}</span>
                            <span className={`font-semibold ${Number(item.adherencePercentage || 0) > 100 ? 'text-red-400' : 'text-emerald-300'}`}>
                              {Number(item.adherencePercentage || 0).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savings Progress Summary */}
                  {summary.savingsProgress && summary.savingsProgress.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Savings Progress</h4>
                      <div className="grid gap-2">
                        {summary.savingsProgress.map((item, idx) => (
                          <div key={idx} className="p-3 rounded bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.goalName || 'Unknown'}</span>
                            <span className="text-emerald-300 font-semibold">{Number(item.progressPercentage || 0).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Distribution Summary */}
                  {summary.categoryDistribution && summary.categoryDistribution.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Category Distribution</h4>
                      <div className="grid gap-2">
                        {summary.categoryDistribution.map((item, idx) => (
                          <div key={idx} className="p-3 rounded bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.categoryName || 'Unknown'}</span>
                            <span className="text-emerald-300 font-semibold">${Number(item.amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savings Forecast Summary */}
                  {summary.savingsForecast && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Savings Forecast</h4>
                      <div className="p-4 rounded-2xl bg-white/5 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-blue-300">Current: </span>
                          <span className="text-white font-semibold">${Number(summary.savingsForecast.currentSavings || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-300">6M Projection: </span>
                          <span className="text-emerald-300 font-bold">${Number(summary.savingsForecast.projectedSavings6Months || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-blue-300">No summary data available.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;

