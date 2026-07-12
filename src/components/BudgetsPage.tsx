import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Trash2, Edit2, Loader2, X, TrendingDown } from 'lucide-react';
import { supabase, Budget, BudgetPeriod, TransactionCategory, transactionCategories, expenseCategoryValues, currencies } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function BudgetsPage() {
  const { userSettings } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const currency = currencies.find((c) => c.code === userSettings?.currency) || currencies[0];

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);

      // Calculate spent amounts for current period
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('category, amount, type, date')
        .eq('type', 'expense')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (txError) throw txError;

      const spending: Record<string, number> = {};
      (txData || []).forEach((tx) => {
        spending[tx.category] = (spending[tx.category] || 0) + Number(tx.amount);
      });
      setSpentMap(spending);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const getCategoryLabel = (cat: string) => transactionCategories.find((c) => c.value === cat)?.label || cat;
  const getCategoryIcon = (cat: string) => transactionCategories.find((c) => c.value === cat)?.icon || '📦';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Set spending limits per category and track progress</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Budget
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">No budgets set</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create a budget to start tracking your spending limits</p>
          <button onClick={handleAddNew} className="mt-4 px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors">
            + Add Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const spent = spentMap[budget.category] || 0;
            const percentage = budget.limit_amount > 0 ? Math.min((spent / budget.limit_amount) * 100, 100) : 0;
            const isOver = spent > budget.limit_amount;
            const remaining = budget.limit_amount - spent;

            return (
              <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOver ? 'bg-danger-100' : 'bg-primary-100'}`}>
                      <span className="text-lg">{getCategoryIcon(budget.category)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{getCategoryLabel(budget.category)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{budget.period} budget</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(budget)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(budget.limit_amount)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Budget limit</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${isOver ? 'text-danger-600' : 'text-gray-700 dark:text-gray-200'}`}>{formatCurrency(spent)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Spent this month</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-danger-500' : percentage > 80 ? 'bg-warning-500' : 'bg-primary-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${isOver ? 'text-danger-600' : percentage > 80 ? 'text-warning-600' : 'text-success-600'}`}>
                    {percentage.toFixed(0)}% used
                  </span>
                  <span className={`text-sm ${isOver ? 'text-danger-600 font-medium' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                    {isOver ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <BudgetModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchBudgets}
          budget={editingBudget}
        />
      )}
    </div>
  );
}

function BudgetModal({ isOpen, onClose, onSuccess, budget }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; budget?: Budget | null }) {
  const [category, setCategory] = useState<TransactionCategory>('food_dining');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!budget;

  useEffect(() => {
    if (budget) {
      setCategory(budget.category);
      setLimitAmount(budget.limit_amount.toString());
      setPeriod(budget.period);
    } else {
      setCategory('food_dining');
      setLimitAmount('');
      setPeriod('monthly');
    }
    setError(null);
  }, [budget, isOpen]);

  const availableCategories = transactionCategories.filter((cat) => expenseCategoryValues.includes(cat.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amountNum = parseFloat(limitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ category, limit_amount: amountNum, period, updated_at: new Date().toISOString() })
          .eq('id', budget.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('budgets').insert({ category, limit_amount: amountNum, period });
        if (insertError) throw insertError;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Budget' : 'Add Budget'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm text-left transition-all ${
                    category === cat.value ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Budget Limit</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Period</label>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`py-2.5 px-4 rounded-xl font-medium text-sm capitalize transition-all ${
                    period === p ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg">
              <p className="text-sm text-danger-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isEditing ? 'Update' : 'Add'} Budget</>}
          </button>
        </form>
      </div>
    </div>
  );
}
