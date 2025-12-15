
import React, { useState } from 'react';
import { ArrowRight, Check, Key, Palette, User, Rocket, ShieldCheck } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  initialName?: string;
  onUpdateKey: (key: string) => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, initialName, onUpdateKey }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName || 'Jane Smith');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'light' | 'focus'>('light');

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to InvoiceFlow",
      icon: Rocket,
      content: (
        <div className="text-center">
          <p className="text-slate-600 mb-6">
            Your new AI-powered Support at Home automation assistant. 
            Let's get you set up in less than 2 minutes.
          </p>
        </div>
      )
    },
    // Step 1: Profile
    {
      title: "Confirm Your Profile",
      icon: User,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">How should we address you in reports and logs?</p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            Your role is currently set to <strong>Administrator</strong>.
          </div>
        </div>
      )
    },
    // Step 2: API Key (Crucial)
    {
      title: "Activate AI Engine",
      icon: Key,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            InvoiceFlow uses <strong>Google Gemini</strong> for deep auditing. Please paste your API key below.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gemini API Key</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
          <p className="text-xs text-slate-400">
            Don't have one? <a href="#" className="text-indigo-600 underline">Get a key from Google AI Studio</a>.
          </p>
        </div>
      )
    },
    // Step 3: Customization
    {
      title: "Customize Experience",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Choose your preferred workspace visual style.</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="h-20 bg-white rounded-lg shadow-sm border border-slate-100 mb-2"></div>
              <span className="font-bold text-slate-700 text-sm">Calm Light</span>
            </button>
            <button 
              onClick={() => setTheme('focus')}
              className={`p-4 rounded-xl border-2 transition-all ${theme === 'focus' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="h-20 bg-slate-900 rounded-lg shadow-sm border border-slate-800 mb-2"></div>
              <span className="font-bold text-slate-700 text-sm">High Contrast</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (step === 2 && apiKey) {
      onUpdateKey(apiKey);
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 w-full">
           <div 
             className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
             style={{ width: `${((step + 1) / steps.length) * 100}%` }}
           ></div>
        </div>

        <div className="p-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6 mx-auto">
             <CurrentIcon size={24} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">{steps[step].title}</h2>
          
          <div className="mb-8 mt-6">
            {steps[step].content}
          </div>

          <div className="flex gap-3">
             {step > 0 && (
               <button 
                 onClick={() => setStep(step - 1)}
                 className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
               >
                 Back
               </button>
             )}
             <button 
               onClick={handleNext}
               className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
             >
               {step === steps.length - 1 ? 'Get Started' : 'Continue'} <ArrowRight size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
