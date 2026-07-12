import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, Loader2 } from 'lucide-react';
import { supabase, Transaction, TransactionType, TransactionCategory, transactionCategories, incomeCategoryValues, expenseCategoryValues, savingCategoryValues, currencies } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
};

export function TransactionModal({ isOpen, onClose, onSuccess, transaction }: TransactionModalProps) {
  const { userSettings } = useAuth();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('food_dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
      setNote(transaction.note || '');
    } else {
      setType('expense');
      setAmount('');
      setCategory('food_dining');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setError(null);
  }, [transaction, isOpen]);

  useEffect(() => {
    const validCategories = getCategoriesForType(type);
    if (!validCategories.includes(category)) {
      setCategory(validCategories[0]);
    }
  }, [type]);

  const getCategoriesForType = (t: TransactionType): TransactionCategory[] => {
    if (t === 'income') return incomeCategoryValues;
    if (t === 'expense') return expenseCategoryValues;
    return savingCategoryValues;
  };

  const currency = currencies.find((c) => c.code === userSettings?.currency) || currencies[0];
  const currencySymbol = currency.symbol;

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

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ type, amount: amountNum, category, date, note: note || null, updated_at: new Date().toISOString() })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('transactions').insert({ type, amount: amountNum, category, date, note: note || null });
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

  const availableCategories = transactionCategories.filter((cat) => getCategoriesForType(type).includes(cat.value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['income', 'expense', 'saving'] as TransactionType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`py-2.5 px-4 rounded-xl font-medium text-sm capitalize transition-all ${type === t ? t === 'income' ? 'bg-success-500 text-white shadow-sm' : t === 'expense' ? 'bg-danger-500 text-white shadow-sm' : 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <div className="grid grid-cols-2 gap-2 pl-10">
                {availableCategories.map((cat) => (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)} className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm text-left transition-all ${category === cat.value ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'}`}><span>{cat.icon}</span><span className="truncate">{cat.label}</span></button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Note (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." rows={3} className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none" />
            </div>
          </div>
          {error && <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg"><p className="text-sm text-danger-600">{error}</p></div>}
          <button type="submit" disabled={loading} className={`w-full py-3 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'income' ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700' : type === 'expense' ? 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'}`}>{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isEditing ? 'Update' : 'Add'} Transaction</>}</button>
        </form>
      </div>
    </div>
  );
}
