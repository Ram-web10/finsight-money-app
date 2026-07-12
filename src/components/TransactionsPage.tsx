import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, PiggyBank, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, Transaction, TransactionType, TransactionCategory, transactionCategories, currencies } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from './TransactionModal';

export function TransactionsPage() {
  const { userSettings } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const currency = currencies.find((c) => c.code === userSettings?.currency) || currencies[0];

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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('transactions').select('*', { count: 'exact' });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      if (searchQuery) {
        query = query.ilike('note', `%${searchQuery}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.order('date', { ascending: false }).order('created_at', { ascending: false }).range(from, to);

      if (error) throw error;

      setTransactions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, searchQuery, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchTransactions();
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getTypeIcon = (type: TransactionType) => {
    if (type === 'income') return TrendingUp;
    if (type === 'expense') return TrendingDown;
    return PiggyBank;
  };

  const getTypeColor = (type: TransactionType) => {
    if (type === 'income') return 'bg-success-100 text-success-600';
    if (type === 'expense') return 'bg-danger-100 text-danger-600';
    return 'bg-primary-100 text-primary-600';
  };

  const getCategoryLabel = (cat: TransactionCategory) => {
    return transactionCategories.find((c) => c.value === cat)?.label || cat;
  };

  const getCategoryIcon = (cat: TransactionCategory) => {
    return transactionCategories.find((c) => c.value === cat)?.icon || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your income, expenses, and savings</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm">
          <Plus className="w-5 h-5" />Add Transaction
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input type="text" placeholder="Search by note..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')} className="pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none bg-white dark:bg-gray-800 cursor-pointer">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="saving">Saving</option>
            </select>
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as TransactionCategory | 'all')} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none bg-white dark:bg-gray-800 cursor-pointer">
            <option value="all">All Categories</option>
            {transactionCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp className="w-8 h-8 text-gray-400" /></div>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first transaction to get started</p>
            <button onClick={handleAddNew} className="mt-4 px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors">+ Add Transaction</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Transaction</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Note</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {transactions.map((transaction) => {
                    const TypeIcon = getTypeIcon(transaction.type);
                    const typeColor = getTypeColor(transaction.type);
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColor}`}><TypeIcon className="w-5 h-5" /></div>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{transaction.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><span>{getCategoryIcon(transaction.category)}</span><span className="text-gray-600 dark:text-gray-300">{getCategoryLabel(transaction.category)}</span></div></td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</td>
                        <td className="px-6 py-4"><span className="text-gray-500 text-sm truncate max-w-[200px] block">{transaction.note || '-'}</span></td>
                        <td className="px-6 py-4 text-right"><span className={`font-semibold ${transaction.type === 'income' ? 'text-success-600' : transaction.type === 'expense' ? 'text-danger-600' : 'text-primary-600'}`}>{transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}</span></td>
                        <td className="px-6 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleEdit(transaction)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-primary-600" title="Edit"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(transaction.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-danger-600" title="Delete"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} transactions</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={handleModalSuccess} transaction={editingTransaction} />
    </div>
  );
}
