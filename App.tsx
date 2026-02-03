
import React, { useState, useEffect } from 'react';
import { Round, InitialData } from './types';
import { calculateInitialRound, calculateNextRound, parseCurrencyShortcut, formatNumberWithCommas, stripCommas } from './utils/calculations';
import { OpenCapLogo, PlusIcon, MoonIcon, SunIcon, ChartIcon, TrashIcon } from './components/Icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currency, setCurrency] = useState<'$' | '€'>('$');
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'Investor' | 'Founder'>('Founder');

  // Initial setup form states
  const [setupRoundName, setSetupRoundName] = useState('Initial Round');
  const [setupInvestment, setSetupInvestment] = useState('');
  const [setupEquity, setSetupEquity] = useState('');
  const [setupPreMoney, setSetupPreMoney] = useState('');

  // States for adding new rounds (modal)
  const [nextRoundName, setNextRoundName] = useState('Round 2');
  const [nextRoundInvestment, setNextRoundInvestment] = useState('');
  const [nextRoundEquity, setNextRoundEquity] = useState('');
  const [nextRoundPreMoney, setNextRoundPreMoney] = useState('');

  // Keyboard shortcut for '+'
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only allow if initial data exists and we are not in an input field
      if (initialData && (e.key === '+' || e.key === '=') && !isRoundModalOpen) {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
        
        if (!isInput) {
          e.preventDefault();
          setIsRoundModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [initialData, isRoundModalOpen]);

  // Apply dark mode to body and html
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('bg-[#15202b]');
      document.body.classList.remove('bg-slate-50');
    } else {
      root.classList.remove('dark');
      document.body.classList.add('bg-slate-50');
      document.body.classList.remove('bg-[#15202b]');
    }
  }, [isDarkMode]);

  // Shared Calculation Logic
  const calculatePreFromInvAndEquity = (invStr: string, eqStr: string) => {
    const inv = parseFloat(parseCurrencyShortcut(invStr));
    const eq = parseFloat(eqStr);
    if (!isNaN(inv) && !isNaN(eq) && eq > 0 && eq < 100) {
      const post = inv / (eq / 100);
      const pre = post - inv;
      return formatNumberWithCommas(Math.round(pre).toString());
    }
    return '';
  };

  const calculateInvFromPreAndEquity = (preStr: string, eqStr: string) => {
    const pre = parseFloat(parseCurrencyShortcut(preStr));
    const eq = parseFloat(eqStr);
    if (!isNaN(pre) && !isNaN(eq) && eq > 0 && eq < 100) {
      const inv = (pre * (eq / 100)) / (1 - eq / 100);
      return formatNumberWithCommas(Math.round(inv).toString());
    }
    return '';
  };

  const calculateEquityFromInvAndPre = (invStr: string, preStr: string) => {
    const inv = parseFloat(parseCurrencyShortcut(invStr));
    const pre = parseFloat(parseCurrencyShortcut(preStr));
    if (!isNaN(inv) && !isNaN(pre) && (inv + pre) > 0) {
      const eq = (inv / (inv + pre)) * 100;
      return eq.toFixed(2);
    }
    return '';
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(parseCurrencyShortcut(setupInvestment)) || 0;
    const pre = parseFloat(parseCurrencyShortcut(setupPreMoney));
    const equitySold = parseFloat(setupEquity) || 0;
    
    // Ownership based on role
    let own = 0;
    if (userRole === 'Investor') {
      own = equitySold;
    } else {
      // Founder role
      own = 100 - equitySold;
    }

    if (isNaN(pre)) return;

    const postMoney = pre + inv;
    const data: InitialData = {
      companyValuation: postMoney,
      userOwnershipPercentage: own,
    };
    
    setInitialData(data);
    
    const firstRound: Round = {
      id: 'initial',
      name: setupRoundName,
      date: new Date().toISOString().split('T')[0],
      investmentAmount: inv,
      preMoneyValuation: pre,
      postMoneyValuation: postMoney,
      userOwnershipPercentage: own,
      userValue: (own / 100) * postMoney,
      isInitial: true
    };
    
    setRounds([firstRound]);
  };

  const handleAddRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData || rounds.length === 0) return;

    const inv = parseFloat(parseCurrencyShortcut(nextRoundInvestment));
    const pre = parseFloat(parseCurrencyShortcut(nextRoundPreMoney));
    if (isNaN(inv) || isNaN(pre)) return;

    const prevRound = rounds[rounds.length - 1];
    const newRound = calculateNextRound(
      prevRound,
      inv,
      pre,
      nextRoundName
    );

    const updatedRounds = [...rounds, newRound];
    setRounds(updatedRounds);
    setIsRoundModalOpen(false);
    setNextRoundInvestment('');
    setNextRoundEquity('');
    setNextRoundPreMoney('');
    setNextRoundName(`Round ${updatedRounds.length + 1}`);
  };

  const handleDeleteRound = (id: string) => {
    const updatedRounds = rounds.filter(r => r.id !== id);
    if (updatedRounds.length === 0) {
      setInitialData(null);
      setRounds([]);
      return;
    }
    const newChain: Round[] = [];
    for (let i = 0; i < updatedRounds.length; i++) {
      const current = updatedRounds[i];
      if (i === 0) {
        const userValue = (initialData!.userOwnershipPercentage / 100) * current.postMoneyValuation;
        newChain.push({ 
          ...current, 
          userOwnershipPercentage: initialData!.userOwnershipPercentage,
          userValue: userValue,
          isInitial: true 
        });
      } else {
        const prev = newChain[i - 1];
        const recalced = calculateNextRound(
          prev,
          current.investmentAmount,
          current.preMoneyValuation,
          current.name
        );
        newChain.push({ ...current, ...recalced, id: current.id });
      }
    }
    setRounds(newChain);
  };

  const currentRound = rounds[rounds.length - 1];

  const ThemeToggle = () => (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#38444d] transition-colors"
      aria-label="Toggle Theme"
    >
      {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
    </button>
  );

  const CurrencyToggle = () => (
    <button 
      onClick={() => setCurrency(prev => prev === '$' ? '€' : '$')}
      className="p-2 w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-[#38444d] transition-colors flex items-center justify-center font-bold text-lg dark:text-white"
      aria-label="Toggle Currency"
    >
      {currency === '$' ? '$' : '€'}
    </button>
  );

  const Disclaimer = () => (
    <footer className="mt-auto py-8 text-center w-full">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-[#8899a6] opacity-60">
        Built with AI by{' '}
        <a 
          href="https://github.com/birkeal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-500 transition-colors underline underline-offset-4 decoration-slate-300 dark:decoration-[#38444d]"
        >
          Alexander Birke
        </a>
      </p>
    </footer>
  );

  if (!initialData) {
    return (
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isDarkMode ? 'bg-[#15202b]' : 'bg-slate-50'}`}>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#1e2732] rounded-[2.5rem] shadow-2xl p-10 transition-all border border-slate-100 dark:border-[#38444d]">
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col">
                <OpenCapLogo isDark={isDarkMode} className="w-[180px] h-auto" />
              </div>
              <div className="flex gap-2 items-center">
                <CurrencyToggle />
                <ThemeToggle />
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-[#8899a6] mb-8 font-medium leading-relaxed">
              Enter the details of your starting round. Select your role to calculate ownership from your perspective.
            </p>

            <form onSubmit={handleStart} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black mb-3 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6] dark:opacity-70">Your Role</label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#15202b] rounded-2xl border border-slate-200 dark:border-[#38444d]">
                    <button 
                      type="button"
                      onClick={() => setUserRole('Founder')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${userRole === 'Founder' ? 'bg-white dark:bg-[#38444d] shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#8899a6]'}`}
                    >
                      Founder
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUserRole('Investor')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${userRole === 'Investor' ? 'bg-white dark:bg-[#38444d] shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#8899a6]'}`}
                    >
                      Investor
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black mb-2 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6] dark:opacity-70">Round Name</label>
                  <input 
                    required
                    type="text" 
                    value={setupRoundName}
                    onChange={(e) => setSetupRoundName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black mb-2 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6] dark:opacity-70">Investment ({currency})</label>
                  <input 
                    required
                    type="text" 
                    inputMode="decimal"
                    value={setupInvestment}
                    onChange={(e) => {
                      const formatted = formatNumberWithCommas(e.target.value);
                      setSetupInvestment(formatted);
                      if (setupEquity !== '') {
                        setSetupPreMoney(calculatePreFromInvAndEquity(formatted, setupEquity));
                      } else if (setupPreMoney !== '') {
                        setSetupEquity(calculateEquityFromInvAndPre(formatted, setupPreMoney));
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseCurrencyShortcut(setupInvestment);
                      const formatted = formatNumberWithCommas(parsed);
                      setSetupInvestment(formatted);
                      if (setupEquity !== '') setSetupPreMoney(calculatePreFromInvAndEquity(formatted, setupEquity));
                    }}
                    placeholder="e.g. 1m"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black mb-2 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6] dark:opacity-70">Investor's Equity (%)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={setupEquity}
                    onChange={(e) => {
                      setSetupEquity(e.target.value);
                      if (setupInvestment !== '') {
                        setSetupPreMoney(calculatePreFromInvAndEquity(setupInvestment, e.target.value));
                      } else if (setupPreMoney !== '') {
                        setSetupInvestment(calculateInvFromPreAndEquity(setupPreMoney, e.target.value));
                      }
                    }}
                    placeholder="e.g. 20"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black mb-2 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6] dark:opacity-70">Pre-Money Valuation ({currency})</label>
                  <input 
                    required
                    type="text" 
                    inputMode="decimal"
                    value={setupPreMoney}
                    onChange={(e) => {
                      const formatted = formatNumberWithCommas(e.target.value);
                      setSetupPreMoney(formatted);
                      if (setupInvestment !== '' && setupEquity === '') {
                        setSetupEquity(calculateEquityFromInvAndPre(setupInvestment, formatted));
                      } else {
                        setSetupEquity(calculateEquityFromInvAndPre(setupInvestment, formatted));
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseCurrencyShortcut(setupPreMoney);
                      const formatted = formatNumberWithCommas(parsed);
                      setSetupPreMoney(formatted);
                      if (setupEquity !== '') {
                        setSetupInvestment(calculateInvFromPreAndEquity(formatted, setupEquity));
                      }
                    }}
                    placeholder="e.g. 4m"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-[#15202b] font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg uppercase tracking-widest mt-4"
              >
                Start
              </button>
            </form>
          </div>
        </div>
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'dark bg-[#15202b] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#1e2732]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#38444d] px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <OpenCapLogo isDark={isDarkMode} className="h-6 w-auto" />
          </div>
          <div className="flex gap-1 items-center">
            <CurrencyToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 flex-grow pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1e2732] p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d]">
            <p className="text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider dark:text-[#8899a6]">Stake Value ({userRole})</p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400 truncate tracking-tight">
              {currency}{currentRound.userValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1e2732] p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d]">
            <p className="text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider dark:text-[#8899a6]">Ownership</p>
            <p className="text-2xl font-black truncate tracking-tight text-slate-900 dark:text-white">{currentRound.userOwnershipPercentage.toFixed(2)}%</p>
          </div>
          <div className="bg-white dark:bg-[#1e2732] p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d] col-span-2 md:col-span-1">
            <p className="text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider dark:text-[#8899a6]">Company Valuation</p>
            <p className="text-2xl font-black truncate tracking-tight text-slate-900 dark:text-white">{currency}{currentRound.postMoneyValuation.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1e2732] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d]">
            <div className="flex items-center gap-2 mb-6">
              <ChartIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Value Growth</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rounds}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#38444d' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#8899a6' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', background: isDarkMode ? '#1e2732' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                    itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                    formatter={(val: any) => [`${currency}${val.toLocaleString()}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="userValue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e2732] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d]">
            <h3 className="font-bold mb-4 text-xs opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6]">Dilution Trend</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rounds}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#38444d' : '#e2e8f0'} />
                  <XAxis dataKey="name" fontSize={10} hide />
                  <YAxis fontSize={10} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', background: isDarkMode ? '#1e2732' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                    formatter={(val: any) => [`${val.toFixed(2)}%`, 'Stake']}
                  />
                  <Line type="monotone" dataKey="userOwnershipPercentage" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: isDarkMode ? '#1e2732' : '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e2732] rounded-3xl shadow-sm border border-slate-100 dark:border-[#38444d] overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-[#38444d] flex justify-between items-center">
            <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Investment Rounds</h3>
            <span className="bg-slate-100 dark:bg-[#15202b] text-slate-500 dark:text-[#8899a6] text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-transparent dark:border-[#38444d]">
              {rounds.length} Total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-black opacity-40 bg-slate-50 dark:bg-[#15202b] dark:text-[#8899a6]">
                  <th className="px-6 py-4">Round</th>
                  <th className="px-6 py-4">Valuation</th>
                  <th className="px-6 py-4">Investment</th>
                  <th className="px-6 py-4">Ownership</th>
                  <th className="px-6 py-4">Stake Value</th>
                  <th className="px-6 py-4 text-center"><TrashIcon className="w-4 h-4 mx-auto opacity-40" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#38444d]">
                {rounds.map((round) => (
                  <tr key={round.id} className="text-sm hover:bg-slate-50 dark:hover:bg-[#15202b]/50 transition-colors group">
                    <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">{round.name}</td>
                    <td className="px-6 py-5 font-medium text-slate-600 dark:text-[#8899a6]">{currency}{round.postMoneyValuation.toLocaleString()}</td>
                    <td className="px-6 py-5 text-slate-500 dark:text-[#8899a6]/70">{round.isInitial && round.investmentAmount === 0 ? '-' : `${currency}${round.investmentAmount.toLocaleString()}`}</td>
                    <td className="px-6 py-5 font-semibold text-amber-600 dark:text-amber-500">{round.userOwnershipPercentage.toFixed(2)}%</td>
                    <td className="px-6 py-5 font-black text-blue-600 dark:text-blue-400">
                      {currency}{round.userValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => handleDeleteRound(round.id)}
                        className="p-2 text-slate-300 hover:text-red-500 dark:text-[#38444d] dark:hover:text-red-400 transition-colors"
                        aria-label="Delete Round"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Disclaimer />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-[#15202b] via-white/95 dark:via-[#15202b]/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setIsRoundModalOpen(true)}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-[#15202b] font-black py-5 rounded-3xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Investment Round
          </button>
        </div>
      </div>

      {isRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-[#15202b]/90 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1e2732] w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-[#38444d]">
            <h3 className="text-2xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">New Funding Round</h3>
            <form onSubmit={handleAddRound} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black mb-1 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6]">Round Label</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={nextRoundName}
                  onChange={(e) => setNextRoundName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black mb-1 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6]">New Investment ({currency})</label>
                <input 
                  required
                  type="text" 
                  inputMode="decimal"
                  value={nextRoundInvestment}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value);
                    setNextRoundInvestment(formatted);
                    if (nextRoundEquity !== '') {
                      setNextRoundPreMoney(calculatePreFromInvAndEquity(formatted, nextRoundEquity));
                    } else if (nextRoundPreMoney !== '') {
                      setNextRoundEquity(calculateEquityFromInvAndPre(formatted, nextRoundPreMoney));
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseCurrencyShortcut(nextRoundInvestment);
                    const formatted = formatNumberWithCommas(parsed);
                    setNextRoundInvestment(formatted);
                    if (nextRoundEquity !== '') setNextRoundPreMoney(calculatePreFromInvAndEquity(formatted, nextRoundEquity));
                  }}
                  placeholder="e.g. 1m"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black mb-1 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6]">Investor's equity (%)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={nextRoundEquity}
                  onChange={(e) => {
                    setNextRoundEquity(e.target.value);
                    if (nextRoundInvestment !== '') {
                      setNextRoundPreMoney(calculatePreFromInvAndEquity(nextRoundInvestment, e.target.value));
                    } else if (nextRoundPreMoney !== '') {
                      setNextRoundInvestment(calculateInvFromPreAndEquity(nextRoundPreMoney, e.target.value));
                    }
                  }}
                  placeholder="e.g. 10"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black mb-1 opacity-50 uppercase tracking-[0.2em] dark:text-[#8899a6]">Pre-Money Valuation ({currency})</label>
                <input 
                  required
                  type="text" 
                  inputMode="decimal"
                  value={nextRoundPreMoney}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value);
                    setNextRoundPreMoney(formatted);
                    if (nextRoundInvestment !== '' && nextRoundEquity === '') {
                      setNextRoundEquity(calculateEquityFromInvAndPre(nextRoundInvestment, formatted));
                    } else {
                      setNextRoundEquity(calculateEquityFromInvAndPre(nextRoundInvestment, formatted));
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseCurrencyShortcut(nextRoundPreMoney);
                    const formatted = formatNumberWithCommas(parsed);
                    setNextRoundPreMoney(formatted);
                    if (nextRoundEquity !== '') setNextRoundInvestment(calculateInvFromPreAndEquity(formatted, nextRoundEquity));
                  }}
                  placeholder="e.g. 10m"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#38444d] bg-slate-50 dark:bg-[#15202b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsRoundModalOpen(false)}
                  className="flex-1 py-5 bg-slate-100 dark:bg-[#15202b] text-slate-700 dark:text-[#8899a6] font-black rounded-2xl uppercase tracking-widest text-xs border border-transparent dark:border-[#38444d]"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
                >
                  Apply Round
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
