import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) { throw new Error('Missing Supabase environment variables'); }

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserSettings = { id: string; user_id: string; full_name: string | null; currency: string; onboarding_completed: boolean; created_at: string; updated_at: string; };
export type Currency = { code: string; symbol: string; name: string; };
export type TransactionType = 'income' | 'expense' | 'saving';
export type TransactionCategory = 'food_dining' | 'transport' | 'housing' | 'utilities' | 'entertainment' | 'shopping' | 'health' | 'education' | 'travel' | 'others' | 'salary' | 'freelance' | 'investment' | 'gift';
export type Transaction = { id: string; user_id: string; type: TransactionType; amount: number; category: TransactionCategory; date: string; note: string | null; created_at: string; updated_at: string; };

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' }, { code: 'EUR', symbol: '€', name: 'Euro' }, { code: 'GBP', symbol: '£', name: 'British Pound' }, { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }, { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }, { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }, { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }, { code: 'INR', symbol: '₹', name: 'Indian Rupee' }, { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }, { code: 'KRW', symbol: '₩', name: 'South Korean Won' }, { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' }, { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }, { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' }, { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' }, { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' }, { code: 'DKK', symbol: 'kr', name: 'Danish Krone' }, { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }, { code: 'ZAR', symbol: 'R', name: 'South African Rand' }, { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
];

export const transactionCategories: { value: TransactionCategory; label: string; icon: string }[] = [
  { value: 'food_dining', label: 'Food & Dining', icon: '🍽️' }, { value: 'transport', label: 'Transport', icon: '🚗' }, { value: 'housing', label: 'Housing', icon: '🏠' }, { value: 'utilities', label: 'Utilities', icon: '💡' }, { value: 'entertainment', label: 'Entertainment', icon: '🎬' }, { value: 'shopping', label: 'Shopping', icon: '🛍️' }, { value: 'health', label: 'Health', icon: '🏥' }, { value: 'education', label: 'Education', icon: '📚' }, { value: 'travel', label: 'Travel', icon: '✈️' }, { value: 'others', label: 'Others', icon: '📦' }, { value: 'salary', label: 'Salary', icon: '💰' }, { value: 'freelance', label: 'Freelance', icon: '💼' }, { value: 'investment', label: 'Investment', icon: '📈' }, { value: 'gift', label: 'Gift', icon: '🎁' },
];

export const incomeCategoryValues: TransactionCategory[] = ['salary', 'freelance', 'investment', 'gift'];
export const expenseCategoryValues: TransactionCategory[] = ['food_dining', 'transport', 'housing', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'travel', 'others'];
export const savingCategoryValues: TransactionCategory[] = ['investment', 'others'];

export type LoanType = 'lent' | 'borrowed';
export type LoanStatus = 'active' | 'settled';
export type Loan = { id: string; user_id: string; type: LoanType; amount: number; person_name: string; date: string; due_date: string | null; status: LoanStatus; note: string | null; created_at: string; updated_at: string; };
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type Budget = { id: string; user_id: string; category: TransactionCategory; limit_amount: number; period: BudgetPeriod; created_at: string; updated_at: string; };
export type SavingsGoal = { id: string; user_id: string; name: string; target_amount: number; current_amount: number; target_date: string | null; created_at: string; updated_at: string; };
