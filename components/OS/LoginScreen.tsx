import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { UserProfile } from '../../types';

interface LoginScreenProps {
  onLogin: (profile: UserProfile) => void;
}

const ACCOUNTS = [
    { id: 'new_patient', name: 'PATIENT_INTAKE', hasPass: false, avatar: '➕', color: 'bg-gray-700' },
    { id: 'admin', name: 'SYS_ADMIN', hasPass: true, avatar: '👁️', color: 'bg-red-900' }
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [stage, setStage] = useState<'BOOT' | 'SELECT' | 'INTAKE' | 'AUTH'>('BOOT');
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Intake Form
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ 
      name: '', 
      fear: '', 
      pet: ''
  });
  
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');

  // Boot Sequence
  useEffect(() => {
    if(stage === 'BOOT') {
        const logs = [
            "MNEMOSYNE RECOVERY SYSTEM v3.0",
            "COPYRIGHT 1998 KOGAN LABS",
            "Checking bio-metrics...",
            "Subject pulse: DETECTED",
            "Subject pupil dilation: DETECTED",
            "Initializing Fear Engine...",
            "MOUNTING DRIVE C: ..."
        ];
        
        let delay = 0;
        logs.forEach((line, i) => {
            delay += 600;
            setTimeout(() => {
                setBootLog(prev => [...prev, line]);
                audioService.playHDDNoise();
                if(i === logs.length - 1) {
                    setTimeout(() => setStage('SELECT'), 1000);
                }
            }, delay);
        });
    }
  }, []);

  const handleUserSelect = (id: string) => {
      audioService.playUiClick();
      setSelectedUser(id);
      if(id === 'new_patient') {
          setStage('INTAKE');
          setStep(0);
      } else {
          setStage('AUTH');
      }
  };

  const handleIntakeNext = () => {
      audioService.playUiClick();
      if(step === 0 && !formData.name) return;
      if(step === 1 && !formData.fear) return;
      if(step === 2 && !formData.pet) return;

      if(step < 2) {
          setStep(prev => prev + 1);
      } else {
          // Complete
          const profile: UserProfile = {
              username: formData.name,
              fear: formData.fear,
              petName: formData.pet,
              bestFriend: 'UNKNOWN', // Hidden variable
              livesAlone: true, // Default to true for isolation
              favoriteColor: '#008080', // Default teal
              isAdmin: false,
              themeColor: '#008080',
              created: true
          };
          audioService.playGeneratorStart();
          onLogin(profile);
      }
  };

  const handleAuth = (e: React.FormEvent) => {
      e.preventDefault();
      if(passInput === 'kogan1998') {
          // Admin login
           const profile: UserProfile = {
              username: 'ADMIN',
              fear: 'CONTROL_LOSS',
              petName: 'NULL',
              bestFriend: 'NULL',
              livesAlone: false,
              favoriteColor: '#660000',
              isAdmin: true,
              themeColor: '#660000',
              created: false
          };
          onLogin(profile);
      } else {
          audioService.playError();
          setError("ACCESS DENIED: CONTACT DR. KOGAN");
          setPassInput('');
      }
  };

  if(stage === 'BOOT') {
      return (
          <div className="w-full h-full bg-black text-gray-400 font-mono p-12 text-lg">
              {bootLog.map((l, i) => <div key={i}>{l}</div>)}
              <div className="animate-pulse mt-2">_</div>
          </div>
      );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-10 pointer-events-none"></div>
        
        {stage === 'SELECT' && (
            <div className="bg-gray-200 p-1 border-2 border-white border-b-black border-r-black shadow-xl w-96">
                <div className="bg-blue-900 text-white px-2 py-1 font-bold flex justify-between">
                    <span>SYSTEM LOGON</span>
                    <span>X</span>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <p className="mb-2 text-sm text-gray-600">Please identify yourself:</p>
                    {ACCOUNTS.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => handleUserSelect(u.id)}
                            className="flex items-center gap-4 p-2 hover:bg-blue-100 border border-transparent hover:border-blue-300"
                        >
                            <div className={`w-10 h-10 ${u.color} flex items-center justify-center text-white rounded`}>{u.avatar}</div>
                            <div className="text-left">
                                <div className="font-bold">{u.name}</div>
                                <div className="text-xs text-gray-500">{u.hasPass ? 'Restricted' : 'Open Access'}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {stage === 'INTAKE' && (
            <div className="bg-gray-200 p-1 border-2 border-white border-b-black border-r-black shadow-xl w-96 animate-fade-in">
                <div className="bg-green-800 text-white px-2 py-1 font-bold">
                    PATIENT INTAKE FORM (Step {step+1}/3)
                </div>
                <div className="p-6">
                    {step === 0 && (
                        <>
                            <label className="block text-xs font-bold uppercase mb-2">Subject Name:</label>
                            <input 
                                autoFocus
                                className="w-full border p-2 font-mono"
                                placeholder="ENTER FULL NAME"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </>
                    )}
                    {step === 1 && (
                        <>
                            <label className="block text-xs font-bold uppercase mb-2">Primary Aversion (Phobia):</label>
                            <select 
                                className="w-full border p-2"
                                value={formData.fear}
                                onChange={e => setFormData({...formData, fear: e.target.value})}
                            >
                                <option value="">-- SELECT DIAGNOSIS --</option>
                                <option value="DARKNESS">Scotophobia (Darkness)</option>
                                <option value="ISOLATION">Monophobia (Isolation)</option>
                                <option value="SCOPAESTHESIA">Scopaesthesia (Being Watched)</option>
                                <option value="FAILURE">Atychiphobia (Failure)</option>
                            </select>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <label className="block text-xs font-bold uppercase mb-2">Security Question:</label>
                            <p className="text-xs text-gray-500 mb-2">"What was the name of your first pet?"</p>
                            <input 
                                autoFocus
                                className="w-full border p-2 font-mono"
                                placeholder="ANSWER"
                                value={formData.pet}
                                onChange={e => setFormData({...formData, pet: e.target.value})}
                            />
                        </>
                    )}
                    
                    <div className="mt-6 flex justify-between">
                        <button onClick={() => {setStage('SELECT'); audioService.playUiClick();}} className="text-xs underline text-gray-500">Cancel</button>
                        <button 
                            onClick={handleIntakeNext}
                            className="px-4 py-1 bg-gray-300 border-2 border-white border-b-black border-r-black active:border-t-black active:border-l-black active:bg-gray-400 font-bold"
                        >
                            {step === 2 ? 'SUBMIT RECORD' : 'NEXT >'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {stage === 'AUTH' && (
             <form onSubmit={handleAuth} className="bg-gray-200 p-1 border-2 border-white border-b-black border-r-black shadow-xl w-80">
                <div className="bg-red-800 text-white px-2 py-1 font-bold">
                    ADMINISTRATOR ACCESS
                </div>
                <div className="p-6">
                    <label className="block text-xs font-bold uppercase mb-2">Password:</label>
                     <input 
                        autoFocus
                        type="password"
                        className="w-full border p-2 font-mono"
                        value={passInput}
                        onChange={e => setPassInput(e.target.value)}
                    />
                    {error && <div className="text-red-600 text-xs mt-2 font-bold animate-pulse">{error}</div>}
                    <div className="mt-4 flex justify-end">
                        <button className="px-4 py-1 bg-gray-300 border-2 border-white border-b-black border-r-black font-bold">OK</button>
                    </div>
                    <button type="button" onClick={() => setStage('SELECT')} className="mt-4 text-xs underline">Back</button>
                </div>
             </form>
        )}
    </div>
  );
};

export default LoginScreen;