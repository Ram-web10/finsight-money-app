import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { TransactionsPage } from './components/TransactionsPage';
import { LoansPage } from './components/LoansPage';
import { BudgetsPage } from './components/BudgetsPage';
import { SavingsPage } from './components/SavingsPage';
import { SettingsPage } from './components/SettingsPage';
import { useTheme } from './context/ThemeContext';
import { supabase, Transaction, currencies, transactionCategories } from './lib/supabase';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Search,
  User,
  ChevronDown,
  Filter,
  Download,
  MoreHorizontal,
  BarChart3,
  Activity,
  DollarSign,
  Target,
  LogOut,
  HandCoins,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
};

type CategoryBreakdown = {
  category: string;
  amount: number;
  percentage: number;
};

function Dashboard() {
  const { user, userSettings, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpense: 0, totalSaving: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = useMemo(() => {
    return currencies.find((c) => c.code === userSettings?.currency) || currencies[0];
  }, [userSettings?.currency]);

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);

      if (txError) throw txError;
      setRecentTransactions(transactions || []);

      const { data: monthTransactions, error: monthError } = await supabase
        .from('transactions')
        .select('type, amount, category')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (monthError) throw monthError;

      const summaryData = (monthTransactions || []).reduce(
        (acc, tx) => {
          if (tx.type === 'income') acc.totalIncome += Number(tx.amount);
          else if (tx.type === 'expense') acc.totalExpense += Number(tx.amount);
          else acc.totalSaving += Number(tx.amount);
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, totalSaving: 0 }
      );
      setSummary(summaryData);

      const expenses = (monthTransactions || []).filter((tx) => tx.type === 'expense');
      const totalExpenseAmount = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);

      const categoryMap = expenses.reduce(
        (acc, tx) => {
          const cat = tx.category as string;
          acc[cat] = (acc[cat] || 0) + Number(tx.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      const breakdown = Object.entries(categoryMap)
        .map(([category, amount]) => ({
          category: transactionCategories.find((c) => c.value === category)?.label || category,
          amount,
          percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryBreakdown(breakdown);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab, fetchDashboardData]);

  const netProfit = summary.totalIncome - summary.totalExpense;

  const metrics = [
    { id: 1, title: 'Total Income', value: formatCurrency(summary.totalIncome), icon: DollarSign, bgColor: 'bg-success-50', textColor: 'text-success-700' },
    { id: 2, title: 'Total Expenses', value: formatCurrency(summary.totalExpense), icon: CreditCard, bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
    { id: 3, title: 'Net Profit', value: formatCurrency(netProfit), icon: TrendingUp, bgColor: netProfit >= 0 ? 'bg-primary-50' : 'bg-warning-50', textColor: netProfit >= 0 ? 'text-primary-700' : 'text-warning-700' },
    { id: 4, title: 'Total Savings', value: formatCurrency(summary.totalSaving), icon: PiggyBank, bgColor: 'bg-primary-50', textColor: 'text-primary-700' },
  ];

  const getCategoryIcon = (cat: string) => {
    return transactionCategories.find((c) => c.label === cat || c.value === cat)?.icon || '';
  };

  const getCategoryColor = (index: number) => {
    const colors = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-danger-500', 'bg-primary-400', 'bg-success-400', 'bg-warning-400', 'bg-gray-400'];
    return colors[index % colors.length];
  };

  if (activeTab === 'transactions') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
        <main className="flex-1 ml-64">
          <DashboardHeader user={user} currency={currency} title="Transactions" subtitle="Manage your financial activities" />
          <div className="p-8"><TransactionsPage /></div>
        </main>
      </div>
    );
  }

  if (activeTab === 'loans') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
        <main className="flex-1 ml-64">
          <DashboardHeader user={user} currency={currency} title="Lending & Borrowing" subtitle="Track money you lend and borrow" />
          <div className="p-8"><LoansPage /></div>
        </main>
      </div>
    );
  }

  if (activeTab === 'budgets') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
        <main className="flex-1 ml-64">
          <DashboardHeader user={user} currency={currency} title="Budgets" subtitle="Set spending limits and track progress" />
          <div className="p-8"><BudgetsPage /></div>
        </main>
      </div>
    );
  }

  if (activeTab === 'savings') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
        <main className="flex-1 ml-64">
          <DashboardHeader user={user} currency={currency} title="Savings Goals" subtitle="Set targets and track your savings progress" />
          <div className="p-8"><SavingsPage /></div>
        </main>
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
        <main className="flex-1 ml-64">
          <DashboardHeader user={user} currency={currency} title="Settings" subtitle="Manage your account and preferences" />
          <div className="p-8"><SettingsPage /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} signOut={signOut} user={user} currency={currency} />
      <main className="flex-1 ml-64">
        <DashboardHeader user={user} currency={currency} title="Financial Overview" subtitle="Track your financial health and insights" />
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric) => (
                  <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${metric.bgColor}`}><metric.icon className={`w-6 h-6 ${metric.textColor}`} /></div>
                    </div>
                    <p className="text-gray-500 text-sm mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    <p className="text-xs text-gray-400 mt-2">This month</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Income vs Expenses</h3>
                      <p className="text-sm text-gray-500">Current month summary in {currency.code}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-center gap-8 h-48">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 bg-success-400 rounded-t-lg transition-all duration-300 hover:bg-success-500" style={{ height: summary.totalIncome > 0 ? '150px' : '10px' }}></div>
                      <span className="text-sm text-gray-500 font-medium">Income</span>
                      <span className="text-lg font-bold text-success-600">{formatCurrency(summary.totalIncome)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 bg-danger-400 rounded-t-lg transition-all duration-300 hover:bg-danger-500" style={{ height: summary.totalExpense > 0 ? '150px' : '10px' }}></div>
                      <span className="text-sm text-gray-500 font-medium">Expenses</span>
                      <span className="text-lg font-bold text-danger-600">{formatCurrency(summary.totalExpense)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 bg-primary-400 rounded-t-lg transition-all duration-300 hover:bg-primary-500" style={{ height: summary.totalSaving > 0 ? '150px' : '10px' }}></div>
                      <span className="text-sm text-gray-500 font-medium">Savings</span>
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(summary.totalSaving)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Breakdown</h3>
                      <p className="text-sm text-gray-500">By category</p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  {categoryBreakdown.length === 0 ? (
                    <div className="text-center py-8"><p className="text-gray-400 text-sm">No expenses this month</p></div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {categoryBreakdown.slice(0, 5).map((cat, index) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(index)}`}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{getCategoryIcon(cat.category)} {cat.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(cat.amount)}</span>
                            <span className="text-xs text-gray-400 ml-2">{cat.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                    <p className="text-sm text-gray-500">Your latest financial activities</p>
                  </div>
                  <button onClick={() => setActiveTab('transactions')} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">View All<ArrowRight className="w-4 h-4" /></button>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-gray-400" /></div>
                    <p className="text-gray-500 font-medium">No transactions yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first transaction to get started</p>
                    <button onClick={() => setActiveTab('transactions')} className="mt-4 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">+ Add Transaction</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Transaction</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Category</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Date</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {recentTransactions.slice(0, 5).map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-success-100' : transaction.type === 'expense' ? 'bg-danger-100' : 'bg-primary-100'}`}>
                                  {transaction.type === 'income' ? <TrendingUp className="w-5 h-5 text-success-600" /> : transaction.type === 'expense' ? <TrendingDown className="w-5 h-5 text-danger-600" /> : <PiggyBank className="w-5 h-5 text-primary-600" />}
                                </div>
                                <span className="font-medium text-gray-900 capitalize">{transaction.type}</span>
                              </div>
                            </td>
                            <td className="py-4"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{getCategoryIcon(transaction.category)} {transactionCategories.find((c) => c.value === transaction.category)?.label || transaction.category}</span></td>
                            <td className="py-4 text-sm text-gray-500">{formatDate(transaction.date)}</td>
                            <td className="py-4 text-right"><span className={`font-semibold ${transaction.type === 'income' ? 'text-success-600' : transaction.type === 'expense' ? 'text-danger-600' : 'text-primary-600'}`}>{transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, signOut, user, currency }: { activeTab: string; setActiveTab: (tab: string) => void; signOut: () => void; user: any; currency: any }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-white" /></div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Personal Finance</span>
        </div>
      </div>
      <nav className="px-4 pb-6">
        <div className="space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'transactions', label: 'Transactions', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'budgets', label: 'Budgets', icon: Target },
            { id: 'savings', label: 'Savings', icon: PiggyBank },
            { id: 'loans', label: 'Lending', icon: HandCoins },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><item.icon className="w-5 h-5" />{item.label}</button>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
          <div className="space-y-1">
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'settings' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Settings className="w-5 h-5" />Settings</button>
            <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"><LogOut className="w-5 h-5" />Sign Out</button>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}<span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span></div>
            <div className={`relative w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} /></div>
          </button>
        </div>
      </nav>
    </aside>
  );
}

function DashboardHeader({ user, currency, title, subtitle }: { user: any; currency: any; title: string; subtitle: string }) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="flex items-center justify-between px-8 py-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1><p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p></div>
        <div className="flex items-center gap-4">
          <div className="relative"><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search transactions..." className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg w-64 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 dark:text-white transition-all duration-200" /></div>
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span></button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
            <div className="hidden sm:block"><p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p><p className="text-xs text-gray-500 dark:text-gray-400">{currency.code} Account</p></div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const { user, userSettings, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <AuthPage />;
  if (!userSettings?.onboarding_completed) return <OnboardingFlow />;
  return <Dashboard />;
}

function App() {
  return (<AuthProvider><AppContent /></AuthProvider>);
}

export default App;
