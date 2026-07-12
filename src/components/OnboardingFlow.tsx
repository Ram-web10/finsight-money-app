import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { currencies, Currency } from '../lib/supabase';
import { Wallet, Check, ArrowRight, Loader2, ChevronDown, Globe } from 'lucide-react';

const steps = [
  { id: 1, title: 'Welcome', description: 'Get started with Personal Finance' },
  { id: 2, title: 'Currency', description: 'Select your preferred currency' },
  { id: 3, title: 'Complete', description: 'You are all set!' },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { updateUserSettings } = useAuth();

  const handleComplete = async () => {
    setLoading(true);
    await updateUserSettings({ currency: selectedCurrency.code, onboarding_completed: true });
    setLoading(false);
  };

  const handleNext = () => {
    if (currentStep === steps.length - 2) { handleComplete(); } else { setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1)); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-4"><Wallet className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personal Finance</h1>
        </div>
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${index < currentStep ? 'bg-success-500 text-white' : index === currentStep ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}>
                  {index < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 hidden sm:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && <div className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${index < currentStep ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-600'}`} />}
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {currentStep === 0 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"><Wallet className="w-10 h-10 text-primary-600" /></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to Personal Finance!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Take control of your finances with powerful insights, expense tracking, and savings goals. Let's get you set up in just a few steps.</p>
              <button onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center gap-2 mx-auto">Get Started<ArrowRight className="w-4 h-4" /></button>
            </div>
          )}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4"><Globe className="w-8 h-8 text-success-600" /></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Your Currency</h2>
                <p className="text-gray-500 dark:text-gray-400">Choose your preferred currency for displaying amounts</p>
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Currency</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3"><span className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCurrency.symbol}</span><div className="text-left"><p className="font-medium text-gray-900 dark:text-white">{selectedCurrency.code}</p><p className="text-sm text-gray-500 dark:text-gray-400">{selectedCurrency.name}</p></div></div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {currencies.map((currency) => (
                        <button key={currency.code} onClick={() => { setSelectedCurrency(currency); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedCurrency.code === currency.code ? 'bg-primary-50' : ''}`}>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white w-8">{currency.symbol}</span>
                          <div className="text-left flex-1"><p className="font-medium text-gray-900 dark:text-white">{currency.code}</p><p className="text-sm text-gray-500 dark:text-gray-400">{currency.name}</p></div>
                          {selectedCurrency.code === currency.code && <Check className="w-5 h-5 text-primary-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(0)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Back</button>
                <button onClick={handleNext} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup<ArrowRight className="w-4 h-4" /></>}</button>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success-200"><Check className="w-10 h-10 text-white" /></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">You're All Set!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Your account is configured and ready to use. Start tracking your finances now!</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full"><span className="text-xl">{selectedCurrency.symbol}</span><span className="text-sm font-medium text-gray-600 dark:text-gray-300">{selectedCurrency.code} - {selectedCurrency.name}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
