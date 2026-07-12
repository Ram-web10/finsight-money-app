import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight, HandCoins, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase, Loan, LoanType, LoanStatus } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LoanModal } from './LoanModal';
import { currencies } from '../lib/supabase';

export function LoansPage() {
  const { userSettings } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<LoanType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ totalLent: 0, totalBorrowed: 0, activeLent: 0, activeBorrowed: 0 });
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

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('loans').select('*', { count: 'exact' });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (searchQuery) {
        query = query.ilike('person_name', `%${searchQuery}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.order('date', { ascending: false }).order('created_at', { ascending: false }).range(from, to);

      if (error) throw error;

      setLoans(data || []);
      setTotalCount(count || 0);

      // Fetch summary
      const { data: allLoans, error: summaryError } = await supabase.from('loans').select('type, amount, status');
      if (summaryError) throw summaryError;

      const summaryData = (allLoans || []).reduce(
        (acc, loan) => {
          if (loan.type === 'lent') {
            acc.totalLent += Number(loan.amount);
            if (loan.status === 'active') acc.activeLent += Number(loan.amount);
          } else {
            acc.totalBorrowed += Number(loan.amount);
            if (loan.status === 'active') acc.activeBorrowed += Number(loan.amount);
          }
          return acc;
        },
        { totalLent: 0, totalBorrowed: 0, activeLent: 0, activeBorrowed: 0 }
      );
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchQuery, currentPage]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;

    try {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
      fetchLoans();
    } catch (err) {
      console.error('Error deleting loan:', err);
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLoan(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (loan: Loan) => {
    const newStatus: LoanStatus = loan.status === 'active' ? 'settled' : 'active';
    try {
      const { error } = await supabase
        .from('loans')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', loan.id);
      if (error) throw error;
      fetchLoans();
    } catch (err) {
      console.error('Error updating loan status:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const isOverdue = (loan: Loan) => {
    return loan.status === 'active' && loan.due_date && new Date(loan.due_date) < new Date();
  };

  const summaryCards = [
    {
      title: 'Total Lent',
      value: formatCurrency(summary.totalLent),
      subtitle: `${formatCurrency(summary.activeLent)} still outstanding`,
      icon: ArrowUpRight,
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning-600',
      valueColor: 'text-warning-700',
    },
    {
      title: 'Total Borrowed',
      value: formatCurrency(summary.totalBorrowed),
      subtitle: `${formatCurrency(summary.activeBorrowed)} still to repay`,
      icon: ArrowDownRight,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      valueColor: 'text-primary-700',
    },
    {
      title: 'Net Position',
      value: formatCurrency(summary.activeLent - summary.activeBorrowed),
      subtitle: summary.activeLent - summary.activeBorrowed >= 0 ? 'You are owed money' : 'You owe money',
      icon: HandCoins,
      bgColor: summary.activeLent - summary.activeBorrowed >= 0 ? 'bg-success-50' : 'bg-danger-50',
      iconColor: summary.activeLent - summary.activeBorrowed >= 0 ? 'text-success-600' : 'text-danger-600',
      valueColor: summary.activeLent - summary.activeBorrowed >= 0 ? 'text-success-700' : 'text-danger-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lending & Borrowing</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">Track money you lend and borrow</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm mb-1">{card.title}</p>
            <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by person name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as LoanType | 'all')}
              className="pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="lent">Lent</option>
              <option value="borrowed">Borrowed</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LoanStatus | 'all')}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none bg-white dark:bg-gray-800 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandCoins className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">No loan records found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Track money you lend or borrow</p>
            <button onClick={handleAddNew} className="mt-4 px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors">
              + Add Loan
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Person</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Due Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {loans.map((loan) => {
                    const overdue = isOverdue(loan);
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${loan.type === 'lent' ? 'bg-warning-100' : 'bg-primary-100'}`}>
                              {loan.type === 'lent' ? (
                                <ArrowUpRight className={`w-5 h-5 text-warning-600`} />
                              ) : (
                                <ArrowDownRight className={`w-5 h-5 text-primary-600`} />
                              )}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{loan.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-gray-900 dark:text-white font-medium">{loan.person_name}</span>
                            {loan.note && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">{loan.note}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">{formatDate(loan.date)}</td>
                        <td className="px-6 py-4 text-sm">
                          {loan.due_date ? (
                            <span className={overdue ? 'text-danger-600 font-medium' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}>
                              {formatDate(loan.due_date)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(loan)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              loan.status === 'active'
                                ? overdue
                                  ? 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                                  : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
                                : 'bg-success-50 text-success-600 hover:bg-success-100'
                            }`}
                          >
                            {loan.status === 'settled' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {loan.status === 'active' && overdue && <AlertCircle className="w-3.5 h-3.5" />}
                            {loan.status === 'active' && !overdue && <Clock className="w-3.5 h-3.5" />}
                            <span className="capitalize">{overdue ? 'overdue' : loan.status}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-semibold ${loan.type === 'lent' ? 'text-warning-600' : 'text-primary-600'}`}>
                            {loan.type === 'lent' ? '+' : '-'}
                            {formatCurrency(loan.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(loan)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary-600"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(loan.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-danger-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} loans
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LoanModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchLoans} loan={editingLoan} />
    </div>
  );
}
