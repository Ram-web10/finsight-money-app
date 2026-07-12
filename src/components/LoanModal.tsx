import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, FileText, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { supabase, Loan, LoanType, LoanStatus } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type LoanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan?: Loan | null;
};

export function LoanModal({ isOpen, onClose, onSuccess, loan }: LoanModalProps) {
  const { userSettings } = useAuth();
  const [type, setType] = useState<LoanType>('lent');
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<LoanStatus>('active');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!loan;

  useEffect(() => {
    if (loan) {
      setType(loan.type);
      setAmount(loan.amount.toString());
      setPersonName(loan.person_name);
      setDate(loan.date);
      setDueDate(loan.due_date || '');
      setStatus(loan.status);
      setNote(loan.note || '');
    } else {
      setType('lent');
      setAmount('');
      setPersonName('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setStatus('active');
      setNote('');
    }
    setError(null);
  }, [loan, isOpen]);

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

    if (!personName.trim()) {
      setError('Please enter a person name');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('loans')
          .update({
            type,
            amount: amountNum,
            person_name: personName.trim(),
            date,
            due_date: dueDate || null,
            status,
            note: note || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', loan.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('loans').insert({
          type,
          amount: amountNum,
          person_name: personName.trim(),
          date,
          due_date: dueDate || null,
          status,
          note: note || null,
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Loan' : 'Add Loan'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Loan Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Loan Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['lent', 'borrowed'] as LoanType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                    type === t
                      ? t === 'lent'
                        ? 'bg-warning-500 text-white shadow-sm'
                        : 'bg-primary-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {t === 'lent' ? 'Lent (I gave money)' : 'Borrowed (I took money)'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Amount</label>
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

          {/* Person Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {type === 'lent' ? 'Borrower Name' : 'Lender Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={type === 'lent' ? 'Who did you lend to?' : 'Who did you borrow from?'}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Due Date (Optional)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['active', 'settled'] as LoanStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm capitalize transition-all ${
                    status === s
                      ? s === 'active'
                        ? 'bg-warning-500 text-white shadow-sm'
                        : 'bg-success-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {s === 'settled' && <CheckCircle2 className="w-4 h-4" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Note (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
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
            className={`w-full py-3 text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              type === 'lent'
                ? 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isEditing ? 'Update' : 'Add'} Loan</>}
          </button>
        </form>
      </div>
    </div>
  );
}
