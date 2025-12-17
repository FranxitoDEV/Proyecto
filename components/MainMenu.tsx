import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { audioService } from '../services/audioService';

interface MainMenuProps {
  gameState: GameState;
  startGame: () => void;
  resetGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  gameState, 
  startGame, 
  resetGame
}) => {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (gameState === GameState.MENU) {
      const lines = [
        "MNEMOSYNE ENGINE v6.6.6",
        "Loading Assets...",
        "Connecting to Neural Interface...",
        "WARNING: Bio-feedback unstable."
      ];
      
      let i = 0;
      setBootLines([]);
      setShowMenu(false);

      const interval = setInterval(() => {
        if (i < lines.length) {
            audioService.playUiClick();
            setBootLines(prev => [...prev, lines[i]]);
            i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowMenu(true), 500);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Glitch effect
  useEffect(() => {
      if (gameState !== GameState.MENU) return;
      const interval = setInterval(() => {
          if(Math.random() > 0.9) {
              setGlitch(true);
              audioService.playGlitch();
              setTimeout(() => setGlitch(false), 200);
          }
      }, 2000);
      return () => clearInterval(interval);
  }, [gameState]);

  const handleStart = () => {
      audioService.playGeneratorStart();
      startGame();
  };

  const handleExit = () => {
      audioService.playError();
      // Force return to desktop logic requires passing a state setter or calling resetGame if it goes to desktop
      // For now, resetGame goes to Desktop based on App.tsx logic
      resetGame(); 
  };

  if (gameState === GameState.PLAYING) return null;

  return (
    <div className={`absolute inset-0 z-50 bg-black text-green-500 font-retro overflow-hidden flex flex-col ${glitch ? 'grayscale invert' : ''}`}>
      
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0bnF4bmQ5bnd4bmQ5bnd4bmQ5bnd4bmQ5bnd4bmQ5bnd4/oEI9uBYSzLpBK/giphy.gif')] bg-cover"></div>

      {gameState === GameState.MENU && (
        <div className="relative z-10 w-full h-full flex flex-col p-12">
            
            <div className="h-1/4 w-full border-b border-green-900 mb-8 font-mono text-xs md:text-sm opacity-70">
                {bootLines.map((line, idx) => (
                    <div key={idx} className="mb-1">{line}</div>
                ))}
            </div>

            {showMenu && !showOptions && (
                <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                     <h1 className="text-7xl md:text-9xl font-bold tracking-widest text-red-600 mb-12 animate-pulse text-shadow-retro" style={{fontFamily: 'Courier New'}}>
                        MNEMOSYNE
                     </h1>

                     <div className="flex flex-col gap-6 w-64 text-center">
                         <button onClick={handleStart} className="text-3xl hover:bg-red-900 hover:text-white border-2 border-transparent hover:border-red-600 transition-all p-2">INICIAR</button>
                         <button className="text-3xl hover:bg-red-900 hover:text-white border-2 border-transparent hover:border-red-600 transition-all p-2 opacity-50 cursor-not-allowed">CONTINUAR</button>
                         <button onClick={() => setShowOptions(true)} className="text-3xl hover:bg-red-900 hover:text-white border-2 border-transparent hover:border-red-600 transition-all p-2">OPCIONES</button>
                         <button onClick={handleExit} className="text-3xl hover:bg-red-900 hover:text-white border-2 border-transparent hover:border-red-600 transition-all p-2">SALIR</button>
                     </div>
                </div>
            )}

            {showOptions && (
                 <div className="flex-1 flex flex-col items-center justify-center animate-fade-in bg-black/90 p-8 border border-green-500">
                     <h2 className="text-4xl mb-8">OPCIONES</h2>
                     <div className="flex flex-col gap-4 w-96">
                         <div className="flex justify-between">
                             <span>AUDIO</span>
                             <input type="range" />
                         </div>
                         <div className="flex justify-between">
                             <span>GAMMA</span>
                             <input type="range" />
                         </div>
                         <div className="flex justify-between">
                             <span>DIFFICULTY</span>
                             <span className="text-red-500 font-bold">NIGHTMARE</span>
                         </div>
                     </div>
                     <button onClick={() => setShowOptions(false)} className="mt-8 border border-white p-2 hover:bg-white hover:text-black">BACK</button>
                 </div>
            )}
            
            <div className="absolute bottom-4 right-4 text-xs text-gray-600">
                BUILD: 666.0.1 (ALPHA) | UNAUTHORIZED ACCESS DETECTED
            </div>
        </div>
      )}

      {/* GAME OVER & VICTORY SCREENS REMAIN SAME */}
      {gameState === GameState.GAME_OVER && (
        <div className="flex flex-col items-center justify-center w-full h-full text-center relative z-20">
          <div className="border-4 border-red-600 p-12 bg-black max-w-2xl shadow-[0_0_100px_rgba(255,0,0,0.6)] animate-bounce">
             <h1 className="text-8xl text-red-600 mb-4 font-bold tracking-tighter">FATAL ERROR</h1>
             <p className="text-2xl text-gray-300 mb-12 font-mono">Su mente ha sido asimilada por el sistema.</p>
             <button onClick={() => {audioService.playUiClick(); resetGame();}} className="px-12 py-4 bg-red-900 text-white border-2 border-red-500 hover:bg-red-600 font-retro text-3xl animate-pulse">REINICIAR PROTOCOLO</button>
          </div>
        </div>
      )}
      
      {gameState === GameState.VICTORY && (
        <div className="flex flex-col items-center justify-center w-full h-full text-center relative z-20">
           <div className="border-4 border-blue-500 p-12 bg-black/90 max-w-2xl backdrop-blur-sm">
             <h1 className="text-6xl text-blue-400 mb-6">SISTEMA PURGADO</h1>
             <p className="text-xl text-blue-200 mb-8 leading-relaxed">Has recuperado los fragmentos de tu memoria.<br/>Pero... ¿son estos recuerdos realmente tuyos?</p>
             <button onClick={() => {audioService.playUiClick(); resetGame();}} className="px-8 py-3 bg-blue-900 text-white border border-blue-400 hover:bg-blue-600 font-retro text-2xl">DESCONECTAR</button>
          </div>
        </div>
      )}
      
      <div className="scanline"></div>
    </div>
  );
};

export default MainMenu;