import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FileDown, Calendar, TrendingUp, DollarSign, PieChart, Target } from 'lucide-react';

function Reports({ user }) {
  const [activeReport, setActiveReport] = useState('monthly-expenditure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reportRef = useRef(null);
  
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
  
  // NEW: Date range for category distribution
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days by default
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const REPORT_API = process.env.REACT_APP_REPORT_API || 'http://localhost:8095/api/reports';
  const CATEGORY_API = process.env.REACT_APP_CATEGORY_API || 'http://localhost:8081/api/categories';

  const userId = useMemo(() => {
    const u = user?.user || user;
    return u?.user_id || u?.id || u?.userId || user?.id || user?.user_id || user?.userId || 1;
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    loadCurrentReport();
  }, [userId, activeReport, month, year, categoryType, startDate, endDate]);

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
        // FIXED: Add date range and categoryType parameters
        url = `${REPORT_API}/category-distribution?userId=${userId}&startDate=${startDate}&endDate=${endDate}&categoryType=${categoryType}`;
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
    
    console.log('🔍 Loading report from:', url);
    
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('📦 Report data received:', data);
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
        console.error('❌ Error loading report:', err);
        setError(`Failed to load report data: ${err.message}`);
        setLoading(false);
      });
  }

  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    try {
      const reportData = {
        title: getReportTitle(),
        date: new Date().toLocaleDateString(),
        userId: userId,
        data: getCurrentReportData()
      };

      const printWindow = window.open('', '_blank');
      const printContent = generatePrintHTML(reportData);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getReportTitle = () => {
    const titles = {
      'monthly-expenditure': 'Monthly Expenditure Analysis',
      'budget-adherence': 'Budget Adherence Tracking',
      'savings-progress': 'Savings Goal Progress',
      'category-distribution': 'Category-wise Expense Distribution',
      'savings-forecast': 'Forecasted Savings Trends',
      'summary': 'Complete Financial Report Summary'
    };
    return titles[activeReport] || 'Financial Report';
  };

  const getCurrentReportData = () => {
    switch(activeReport) {
      case 'monthly-expenditure': return monthlyExpenditure;
      case 'budget-adherence': return budgetAdherence;
      case 'savings-progress': return savingsProgress;
      case 'category-distribution': return categoryDistribution;
      case 'savings-forecast': return savingsForecast;
      case 'summary': return summary;
      default: return null;
    }
  };

  const generatePrintHTML = (reportData) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 40px;
            background: white;
            color: #1a1a1a;
          }
          .header {
            border-bottom: 3px solid #06b6d4;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #7c3aed;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            color: #06b6d4;
            font-size: 20px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .data-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #d1d5db;
          }
          .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .data-table tr:hover {
            background: #f9fafb;
          }
          .metric-card {
            background: #f0f9ff;
            border-left: 4px solid #06b6d4;
            padding: 15px;
            margin-bottom: 15px;
          }
          .metric-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .metric-value {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-success { background: #d1fae5; color: #065f46; }
          .status-warning { background: #fef3c7; color: #92400e; }
          .status-danger { background: #fee2e2; color: #991b1b; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportData.title}</h1>
          <div class="header-info">
            <span>User ID: ${reportData.userId}</span>
            <span>Generated: ${reportData.date}</span>
          </div>
        </div>
        ${generateReportContent(activeReport, reportData.data)}
        <div class="footer">
          <p>Financial Management System - Confidential Report</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateReportContent = (reportType, data) => {
    if (!data) return '<p>No data available</p>';

    switch(reportType) {
      case 'monthly-expenditure':
        return generateMonthlyExpenditureHTML(data);
      case 'budget-adherence':
        return generateBudgetAdherenceHTML(data);
      case 'savings-progress':
        return generateSavingsProgressHTML(data);
      case 'category-distribution':
        return generateCategoryDistributionHTML(data);
      case 'savings-forecast':
        return generateSavingsForecastHTML(data);
      case 'summary':
        return generateSummaryHTML(data);
      default:
        return '<p>No data available</p>';
    }
  };

  const generateMonthlyExpenditureHTML = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '<p>No expenditure data available</p>';
    
    const totalExpenditure = data.reduce((sum, item) => sum + Number(item.categoryTotal || item.expenditure || item.amount || 0), 0);
    const totalTransactions = data.reduce((sum, item) => sum + Number(item.transactionCount || 0), 0);

    return `
      <div class="section">
        <h2 class="section-title">Overview</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div class="metric-card">
            <div class="metric-label">Total Expenditure</div>
            <div class="metric-value">$${totalExpenditure.toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Transactions</div>
            <div class="metric-value">${totalTransactions}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Per Category</div>
            <div class="metric-value">$${(totalExpenditure / data.length).toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <h2 class="section-title">Category Breakdown</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Transactions</th>
              <th>Average</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => {
              const amount = Number(item.categoryTotal || item.expenditure || item.amount || 0);
              const transactions = Number(item.transactionCount || 0);
              const average = transactions > 0 ? amount / transactions : 0;
              const percentage = totalExpenditure > 0 ? (amount / totalExpenditure * 100) : 0;
              return `
                <tr>
                  <td><strong>${item.categoryName || item.category || 'Unknown'}</strong></td>
                  <td>$${amount.toFixed(2)}</td>
                  <td>${transactions}</td>
                  <td>$${average.toFixed(2)}</td>
                  <td>${percentage.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateBudgetAdherenceHTML = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '<p>No budget adherence data available</p>';
    
    return `
      <div class="section">
        <h2 class="section-title">Budget Performance</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Budget Name</th>
              <th>Category</th>
              <th>Budgeted</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Usage %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => {
              const usage = Number(item.percentageUsed || item.adherencePercentage || 0);
              const budgeted = Number(item.budgetAmount || item.budgetedAmount || 0);
              const spent = Number(item.spentAmount || item.actualAmount || 0);
              const remaining = Number(item.remainingAmount || (budgeted - spent));
              const status = item.status || (usage > 100 ? 'OVER_BUDGET' : usage > 90 ? 'WARNING' : 'ON_TRACK');
              const statusClass = status === 'OVER_BUDGET' ? 'status-danger' : status === 'WARNING' ? 'status-warning' : 'status-success';
              
              return `
                <tr>
                  <td><strong>${item.budgetName || 'Unknown'}</strong></td>
                  <td>${item.categoryName || item.category || 'N/A'}</td>
                  <td>$${budgeted.toFixed(2)}</td>
                  <td>$${spent.toFixed(2)}</td>
                  <td>$${remaining.toFixed(2)}</td>
                  <td>${usage.toFixed(1)}%</td>
                  <td><span class="status-badge ${statusClass}">${status.replace('_', ' ')}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateSavingsProgressHTML = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '<p>No savings progress data available</p>';
    
    return `
      <div class="section">
        <h2 class="section-title">Savings Goals Progress</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Goal Name</th>
              <th>Target</th>
              <th>Current</th>
              <th>Remaining</th>
              <th>Progress</th>
              <th>Days Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => {
              const progress = Number(item.percentageComplete || item.progressPercentage || 0);
              const statusClass = progress >= 75 ? 'status-success' : progress >= 40 ? 'status-warning' : 'status-danger';
              
              return `
                <tr>
                  <td><strong>${item.goalName || 'Unknown'}</strong></td>
                  <td>$${Number(item.targetAmount || 0).toFixed(2)}</td>
                  <td>$${Number(item.currentAmount || 0).toFixed(2)}</td>
                  <td>$${Number(item.remainingAmount || 0).toFixed(2)}</td>
                  <td><span class="status-badge ${statusClass}">${progress.toFixed(1)}%</span></td>
                  <td>${item.daysRemaining || 'N/A'}</td>
                  <td>${item.status || 'Active'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateCategoryDistributionHTML = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '<p>No category distribution data available</p>';
    
    const total = data.reduce((sum, item) => sum + Number(item.totalAmount || item.amount || 0), 0);
    
    return `
      <div class="section">
        <h2 class="section-title">Expense Distribution by Category</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th>Total Amount</th>
              <th>Transactions</th>
              <th>Average</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => {
              const amount = Number(item.totalAmount || item.amount || 0);
              const percentage = total > 0 ? (amount / total * 100) : 0;
              
              return `
                <tr>
                  <td><strong>${item.categoryName || item.category || 'Unknown'}</strong></td>
                  <td>${item.categoryType || item.type || 'N/A'}</td>
                  <td>$${amount.toFixed(2)}</td>
                  <td>${item.transactionCount || 0}</td>
                  <td>$${Number(item.averageAmount || 0).toFixed(2)}</td>
                  <td>${percentage.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateSavingsForecastHTML = (data) => {
    if (!data) return '<p>No forecast data available</p>';
    
    return `
      <div class="section">
        <h2 class="section-title">Savings Forecast Analysis</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
          <div class="metric-card">
            <div class="metric-label">Average Monthly Income</div>
            <div class="metric-value">$${Number(data.averageIncome || 0).toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Monthly Expense</div>
            <div class="metric-value">$${Number(data.averageExpense || 0).toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Monthly Savings</div>
            <div class="metric-value">$${Number(data.averageSavings || 0).toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Savings Rate</div>
            <div class="metric-value">${Number(data.savingsRate || 0).toFixed(1)}%</div>
          </div>
        </div>
        <h3 style="color: #374151; margin-top: 20px; margin-bottom: 10px;">Projections</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Projected Savings</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3 Months</td>
              <td>$${Number(data.projected3Months || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>6 Months</td>
              <td>$${Number(data.projected6Months || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>12 Months</td>
              <td>$${Number(data.projected12Months || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 15px; color: #666;"><strong>Trend:</strong> ${data.trend || 'Stable'}</p>
      </div>
    `;
  };

  const generateSummaryHTML = (data) => {
    if (!data) return '<p>No summary data available</p>';
    
    let html = '<div class="section"><h2 class="section-title">Executive Summary</h2>';
    
    if (data.monthlyExpenditure && data.monthlyExpenditure.length > 0) {
      html += generateMonthlyExpenditureHTML(data.monthlyExpenditure);
    }
    
    if (data.budgetAdherence && data.budgetAdherence.length > 0) {
      html += generateBudgetAdherenceHTML(data.budgetAdherence);
    }
    
    if (data.savingsProgress && data.savingsProgress.length > 0) {
      html += generateSavingsProgressHTML(data.savingsProgress);
    }
    
    if (data.categoryDistribution && data.categoryDistribution.length > 0) {
      html += generateCategoryDistributionHTML(data.categoryDistribution);
    }
    
    if (data.savingsForecast) {
      html += generateSavingsForecastHTML(data.savingsForecast);
    }
    
    html += '</div>';
    return html;
  };

  const reportTabs = [
    { key: 'monthly-expenditure', label: 'Monthly Expenditure', icon: Calendar },
    { key: 'budget-adherence', label: 'Budget Adherence', icon: Target },
    { key: 'savings-progress', label: 'Savings Progress', icon: TrendingUp },
    { key: 'category-distribution', label: 'Category Distribution', icon: PieChart },
    { key: 'savings-forecast', label: 'Savings Forecast', icon: DollarSign },
    { key: 'summary', label: 'Summary Report', icon: FileDown }
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
            <p className="text-blue-300">Generate comprehensive financial insights</p>
          </div>
          <button
            onClick={downloadPDF}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(90deg, #22c55e, #06b6d4)' }}
          >
            <FileDown size={20} />
            Download PDF
          </button>
        </div>

        {/* Report Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveReport(tab.key)}
                className={`p-4 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${
                  activeReport === tab.key ? 'text-white shadow-lg' : 'text-blue-200'
                }`}
                style={{
                  background: activeReport === tab.key 
                    ? 'linear-gradient(135deg, #06b6d4, #7c3aed)' 
                    : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <Icon size={24} className="mx-auto mb-2" />
                <div className="text-xs">{tab.label}</div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        {(activeReport === 'monthly-expenditure' || activeReport === 'category-distribution') && (
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-lg font-bold text-white mb-4">Filters</h3>
            {activeReport === 'monthly-expenditure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm mb-2">Month</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-blue-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-blue-300 text-sm mb-2">Year</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-blue-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            {activeReport === 'category-distribution' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-blue-300 text-sm mb-2">Category Type</label>
                  <select
                    value={categoryType}
                    onChange={e => setCategoryType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-blue-900/50 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Categories</option>
                    <option value="Expense">Expense Only</option>
                    <option value="Income">Income Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-blue-300 text-sm mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-blue-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-blue-300 text-sm mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-blue-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Content */}
        <div ref={reportRef} className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-blue-200">Loading report data...</div>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-900">
              <div className="text-red-300 text-center">{error}</div>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-white">{getReportTitle()}</h2>
                <p className="text-blue-300 text-sm mt-1">Generated on {new Date().toLocaleDateString()}</p>
              </div>

              {/* Monthly Expenditure Report */}
              {activeReport === 'monthly-expenditure' && monthlyExpenditure.length === 0 && (
                <div className="text-center py-12 text-blue-300">No expenditure data available for this period.</div>
              )}
              
              {activeReport === 'monthly-expenditure' && monthlyExpenditure.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-blue-300 font-semibold">Category</th>
                        <th className="text-right py-3 px-4 text-blue-300 font-semibold">Amount</th>
                        <th className="text-right py-3 px-4 text-blue-300 font-semibold">Transactions</th>
                        <th className="text-right py-3 px-4 text-blue-300 font-semibold">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyExpenditure.map((item, idx) => {
                        const amount = Number(item.categoryTotal || item.expenditure || item.amount || 0);
                        const count = Number(item.transactionCount || 0);
                        const avg = count > 0 ? amount / count : 0;
                        return (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 px-4 text-white font-medium">{item.categoryName || item.category || 'Unknown'}</td>
                            <td className="py-3 px-4 text-right text-emerald-300 font-bold">${amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-blue-200">{count}</td>
                            <td className="py-3 px-4 text-right text-blue-200">${avg.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Budget Adherence Report */}
              {activeReport === 'budget-adherence' && budgetAdherence.length === 0 && (
                <div className="text-center py-12 text-blue-300">No budget adherence data available.</div>
              )}
              
              {activeReport === 'budget-adherence' && budgetAdherence.length > 0 && (
                <div className="space-y-4">
                  {budgetAdherence.map((item, idx) => {
                    const usage = Number(item.percentageUsed || item.adherencePercentage || 0);
                    const budgeted = Number(item.budgetAmount || item.budgetedAmount || 0);
                    const spent = Number(item.spentAmount || item.actualAmount || 0);
                    const remaining = Number(item.remainingAmount || (budgeted - spent));
                    const status = item.status || (usage > 100 ? 'OVER_BUDGET' : usage > 90 ? 'WARNING' : 'ON_TRACK');
                    
                    return (
                      <div key={idx} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-white font-bold text-lg">{item.budgetName || 'Unknown'}</h4>
                            <p className="text-blue-300 text-sm">{item.categoryName || item.category || 'N/A'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status === 'OVER_BUDGET' ? 'bg-red-500/20 text-red-300' :
                            status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Budgeted</div>
                            <div className="text-white font-semibold">${budgeted.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Spent</div>
                            <div className="text-white font-semibold">${spent.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Remaining</div>
                            <div className={`font-semibold ${remaining >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                              ${Math.abs(remaining).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300">Usage</span>
                            <span className="text-white font-semibold">{usage.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <div 
                              className="h-3 transition-all duration-500" 
                              style={{ 
                                width: `${Math.min(100, usage)}%`,
                                background: usage > 100 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 
                                           usage > 90 ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                                           'linear-gradient(90deg,#22c55e,#06b6d4)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Savings Progress Report */}
              {activeReport === 'savings-progress' && savingsProgress.length === 0 && (
                <div className="text-center py-12 text-blue-300">No savings progress data available.</div>
              )}
              
              {activeReport === 'savings-progress' && savingsProgress.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {savingsProgress.map((item, idx) => {
                    const progress = Number(item.percentageComplete || item.progressPercentage || 0);
                    return (
                      <div key={idx} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h4 className="text-white font-bold text-lg mb-3">{item.goalName || 'Unknown Goal'}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Current</div>
                            <div className="text-white font-semibold">${Number(item.currentAmount || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Target</div>
                            <div className="text-white font-semibold">${Number(item.targetAmount || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Remaining</div>
                            <div className="text-emerald-300 font-semibold">${Number(item.remainingAmount || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-blue-300 text-xs mb-1">Days Left</div>
                            <div className="text-white font-semibold">{item.daysRemaining || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-center mb-3">
                          <span className="text-emerald-300 font-bold text-2xl">{progress.toFixed(1)}%</span>
                          <span className="text-blue-300 text-sm ml-2">Complete</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-3 transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(100, progress)}%`,
                              background: 'linear-gradient(90deg,#22c55e,#06b6d4)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category Distribution Report */}
              {activeReport === 'category-distribution' && categoryDistribution.length === 0 && (
                <div className="text-center py-12 text-blue-300">No category distribution data available.</div>
              )}
              
              {activeReport === 'category-distribution' && categoryDistribution.length > 0 && (() => {
                const total = categoryDistribution.reduce((sum, i) => sum + Number(i.totalAmount || i.amount || 0), 0) || 1;
                const colors = ['#06b6d4', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];
                
                return (
                  <div className="space-y-4">
                    {categoryDistribution.map((item, idx) => {
                      const amount = Number(item.totalAmount || item.amount || 0);
                      const percentage = (amount / total * 100).toFixed(1);
                      const color = colors[idx % colors.length];
                      
                      return (
                        <div key={idx} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div style={{ width: 20, height: 20, borderRadius: 6, background: color }} />
                              <div>
                                <div className="text-white font-bold">{item.categoryName || item.category || 'Unknown'}</div>
                                <div className="text-blue-300 text-xs">{item.categoryType || item.type || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold text-lg">${amount.toFixed(2)}</div>
                              <div className="text-blue-300 text-sm">{percentage}%</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-blue-300">Transactions: </span>
                              <span className="text-white font-semibold">{item.transactionCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-blue-300">Average: </span>
                              <span className="text-white font-semibold">${Number(item.averageAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <div 
                              className="h-3 transition-all duration-500" 
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
                );
              })()}

              {/* Savings Forecast Report */}
              {activeReport === 'savings-forecast' && !savingsForecast && (
                <div className="text-center py-12 text-blue-300">No forecast data available.</div>
              )}
              
              {activeReport === 'savings-forecast' && savingsForecast && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                      <div className="text-white/80 text-sm mb-2">Avg Monthly Income</div>
                      <div className="text-white text-2xl font-bold">${Number(savingsForecast.averageIncome || 0).toFixed(2)}</div>
                    </div>
                    <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                      <div className="text-white/80 text-sm mb-2">Avg Monthly Expense</div>
                      <div className="text-white text-2xl font-bold">${Number(savingsForecast.averageExpense || 0).toFixed(2)}</div>
                    </div>
                    <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      <div className="text-white/80 text-sm mb-2">Avg Monthly Savings</div>
                      <div className="text-white text-2xl font-bold">${Number(savingsForecast.averageSavings || 0).toFixed(2)}</div>
                    </div>
                    <div className="p-5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                      <div className="text-white/80 text-sm mb-2">Savings Rate</div>
                      <div className="text-white text-2xl font-bold">{Number(savingsForecast.savingsRate || 0).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="text-white font-bold text-lg mb-4">Projected Savings</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded bg-white/5">
                        <span className="text-blue-300">3 Months</span>
                        <span className="text-emerald-300 font-bold text-lg">${Number(savingsForecast.projected3Months || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded bg-white/5">
                        <span className="text-blue-300">6 Months</span>
                        <span className="text-emerald-300 font-bold text-lg">${Number(savingsForecast.projected6Months || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded bg-white/5">
                        <span className="text-blue-300">12 Months</span>
                        <span className="text-emerald-300 font-bold text-lg">${Number(savingsForecast.projected12Months || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <span className="text-emerald-300 font-semibold">Trend: </span>
                      <span className="text-white">{savingsForecast.trend || 'Stable'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Report */}
              {activeReport === 'summary' && !summary && (
                <div className="text-center py-12 text-blue-300">No summary data available.</div>
              )}
              
              {activeReport === 'summary' && summary && (
                <div className="space-y-8">
                  {summary.monthlyExpenditure && summary.monthlyExpenditure.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">Monthly Expenditure</h3>
                      <div className="grid gap-3">
                        {summary.monthlyExpenditure.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.categoryName || 'Unknown'}</span>
                            <span className="text-emerald-300 font-bold">${Number(item.categoryTotal || item.expenditure || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.budgetAdherence && summary.budgetAdherence.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">Budget Adherence</h3>
                      <div className="grid gap-3">
                        {summary.budgetAdherence.map((item, idx) => {
                          const usage = Number(item.percentageUsed || item.adherencePercentage || 0);
                          return (
                            <div key={idx} className="p-4 rounded-lg bg-white/5 flex justify-between items-center">
                              <span className="text-blue-200">{item.budgetName || 'Unknown'}</span>
                              <span className={`font-bold ${usage > 100 ? 'text-red-400' : 'text-emerald-300'}`}>
                                {usage.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {summary.savingsProgress && summary.savingsProgress.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">Savings Progress</h3>
                      <div className="grid gap-3">
                        {summary.savingsProgress.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-white/5 flex justify-between items-center">
                            <span className="text-blue-200">{item.goalName || 'Unknown'}</span>
                            <span className="text-emerald-300 font-bold">{Number(item.percentageComplete || item.progressPercentage || 0).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;