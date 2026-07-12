import { useState, useEffect, useCallback } from 'react';
import { Plus, PiggyBank, Trash2, Edit2, Loader2, X, Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { supabase, SavingsGoal, currencies } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function SavingsPage() {
  const { userSettings } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeModal, setContributeModal] = useState<SavingsGoal | null>(null);

  const currency = currencies.find((c) => c.code === userSettings?.currency) || currencies[0];

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      fetchGoals();
    } catch (err) {
      console.error('Error deleting savings goal:', err);
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Set targets and track your progress</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50">
                <PiggyBank className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-primary-700">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-warning-50">
                <Target className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mb-1">Total Target</p>
            <p className="text-2xl font-bold text-warning-700">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-success-50">
                <TrendingUp className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mb-1">Overall Progress</p>
            <p className="text-2xl font-bold text-success-700">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">No savings goals yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create a goal to start saving towards it</p>
          <button onClick={handleAddNew} className="mt-4 px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors">
            + Add Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const percentage = goal.target_amount > 0 ? Math.min((Number(goal.current_amount) / goal.target_amount) * 100, 100) : 0;
            const isComplete = Number(goal.current_amount) >= goal.target_amount;

            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-success-100' : 'bg-primary-100'}`}>
                      <PiggyBank className={`w-5 h-5 ${isComplete ? 'text-success-600' : 'text-primary-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{goal.name}</p>
                      {goal.target_date && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Target: {formatDate(goal.target_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(goal)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(goal.current_amount))}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">of {formatCurrency(goal.target_amount)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${isComplete ? 'text-success-600' : 'text-primary-600'}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-success-500' : 'bg-primary-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <button
                  onClick={() => setContributeModal(goal)}
                  className="mt-4 w-full py-2.5 border border-primary-200 text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Add Contribution
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <SavingsGoalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchGoals} goal={editingGoal} />
      )}

      {contributeModal && (
        <ContributeModal goal={contributeModal} onClose={() => setContributeModal(null)} onSuccess={fetchGoals} />
      )}
    </div>
  );
}

function SavingsGoalModal({ isOpen, onClose, onSuccess, goal }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; goal?: SavingsGoal | null }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!goal;

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
      setCurrentAmount(goal.current_amount.toString());
      setTargetDate(goal.target_date || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
    }
    setError(null);
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const targetNum = parseFloat(targetAmount);
    if (isNaN(targetNum) || targetNum <= 0) {
      setError('Please enter a valid target amount');
      setLoading(false);
      return;
    }

    const currentNum = parseFloat(currentAmount) || 0;

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('savings_goals')
          .update({ name, target_amount: targetNum, current_amount: currentNum, target_date: targetDate || null, updated_at: new Date().toISOString() })
          .eq('id', goal.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('savings_goals').insert({
          name,
          target_amount: targetNum,
          current_amount: currentNum,
          target_date: targetDate || null,
        });
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Goal' : 'Add Savings Goal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, Vacation..."
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Target Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Current Amount (Optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Target Date (Optional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isEditing ? 'Update' : 'Add'} Goal</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function ContributeModal({ goal, onClose, onSuccess }: { goal: SavingsGoal; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    const newAmount = Number(goal.current_amount) + amountNum;

    try {
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
        .eq('id', goal.id);
      if (updateError) throw updateError;
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Contribution</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">Goal: <span className="font-medium text-gray-900 dark:text-white">{goal.name}</span></p>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Current saved: <span className="font-medium text-gray-900 dark:text-white">{goal.current_amount}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Contribution Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
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
            className="w-full py-3 bg-gradient-to-r from-success-500 to-success-600 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Contribution'}
          </button>
        </form>
      </div>
    </div>
  );
}
