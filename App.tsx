import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import GameScene from './components/GameScene';
import UIOverlay from './components/UIOverlay';
import LoginScreen from './components/OS/LoginScreen';
import Desktop from './components/OS/Desktop';
import MainMenu from './components/MainMenu';
import RoomScene from './components/RoomScene';
import { GameState, Objective, UserProfile, AppSettings, PlayerStats, WorldState } from './types';
import { audioService } from './services/audioService';
import { createInitialFileSystem, FileSystemService } from './services/FileSystemService';
import { LevelGenerationService } from './services/LevelGenerationService';

// --- INITIAL DATA ---
const INITIAL_OBJECTIVES: Objective[] = [
  { id: 'explore', text: 'EXPLORE THE FACILITY', completed: false, requiredFor: [] },
  { id: 'survive', text: 'FIND ANSWERS', completed: false, requiredFor: ['explore'] },
];

const INITIAL_STATS: PlayerStats = {
    sanity: 100,
    battery: 100,
    stamina: 100,
    clearanceLevel: 0,
    inventory: [],
    activeEffects: []
};

const App: React.FC = () => {
  // CORE STATE
  const [gameState, setGameState] = useState<GameState>(GameState.ROOM);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ volume: 0.5, sensitivity: 1.0, crtEnabled: true, brightness: 1.0 });

  // GAMEPLAY STATE
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [worldState, setWorldState] = useState<WorldState>({
      generatorsActive: 0,
      doorsUnlocked: [],
      enemiesActive: false,
      threatLevel: 0
  });

  // LEVEL STATE
  const [currentLevelGrid, setCurrentLevelGrid] = useState<number[][]>([]);

  // UI STATE
  const [message, setMessage] = useState<string | null>(null);
  const [interactLabel, setInteractLabel] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string | null>(null);
  
  // ROOM STATE
  const [roomText, setRoomText] = useState<string | null>(null);
  const [pcOn, setPcOn] = useState(false);
  const [computerFocused, setComputerFocused] = useState(false);

  // SERVICES
  const fsService = useMemo(() => {
      return new FileSystemService(createInitialFileSystem(userProfile?.username || 'GUEST'));
  }, [userProfile]);

  const levelGenService = useMemo(() => new LevelGenerationService(), []);

  // Update brightness css variable
  useEffect(() => {
      document.documentElement.style.setProperty('--brightness', settings.brightness.toString());
  }, [settings.brightness]);

  // --- TRANSITIONS ---
  const handleLogin = useCallback((profile: UserProfile) => {
      setUserProfile(profile);
      setGameState(GameState.DESKTOP);
  }, []);

  const focusComputer = () => {
      if(!pcOn) {
           audioService.playStartup();
           setPcOn(true);
           setGameState(GameState.BOOT);
      }
      setComputerFocused(true);
      setRoomText(null);
  };

  const handleShutdown = () => {
      audioService.stopDrone();
      setPcOn(false);
      setComputerFocused(false);
      setGameState(GameState.ROOM);
  };

  const launchGameApp = useCallback(() => {
    // This is the "Incursion" Phase start
    setGameState(GameState.MENU);
  }, []);

  const startGame = useCallback(() => {
    // START OF CORE LOOP - INCURSION
    // Generate Level on Fly
    const newLevel = levelGenService.generateLevel({
        width: 21, // Odd numbers for maze gen
        height: 21,
        difficulty: 1,
        seed: Date.now()
    });
    setCurrentLevelGrid(newLevel);
    
    // Reset Stats for Run
    setStats({...INITIAL_STATS});
    
    audioService.resume();
    audioService.playAmbientDrone();
    setGameState(GameState.PLAYING);
    setMessage("INCURSION_STARTED");
  }, [levelGenService]);

  const resetGame = useCallback(() => {
    // In production, this should not reload page but reset state properly
    // For MVP phase, reload is safer to clear leaks
    window.location.reload();
  }, []);

  // --- GAME LOGIC ---
  const handleStatsChange = useCallback((newStats: Partial<PlayerStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  }, []);

  const handleRoomAction = (action: string) => {
      switch(action) {
          case 'TAKE_PILLS':
              if (stats.sanity < 100) {
                  audioService.playPickup();
                  setStats(prev => ({ ...prev, sanity: Math.min(100, prev.sanity + 25) }));
              }
              break;
          case 'SLEEP':
              // Save Point & Time Advance
              audioService.playError(); 
              setStats(prev => ({ 
                  ...prev, 
                  stamina: 100, 
                  battery: Math.max(0, prev.battery - 20)
              }));
              break;
          case 'LEAVE_ROOM':
              if (gameState === GameState.VICTORY) {
                  resetGame();
              }
              break;
      }
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans perspective-1000">
      
      {/* 3D ROOM LAYER - Unmount when playing to avoid PointerLock conflict */}
      {gameState !== GameState.PLAYING && (
          <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${computerFocused ? 'opacity-10' : 'opacity-100'}`}>
               <RoomScene 
                    onFocusComputer={focusComputer} 
                    pcOn={pcOn} 
                    onInteract={setRoomText}
                    onAction={handleRoomAction}
                    settings={settings}
                    isEpilogue={gameState === GameState.VICTORY}
               />
               {roomText && !computerFocused && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
                       <div className="w-2 h-2 bg-white rounded-full mb-4 shadow-[0_0_10px_white]"></div>
                       <div className="bg-black/80 border border-white text-white p-4 font-serif text-lg max-w-md text-center animate-fade-in">
                           {roomText}
                       </div>
                       <div className="text-gray-400 text-xs mt-2">[E] INTERACT</div>
                   </div>
               )}
          </div>
      )}

      {/* COMPUTER SCREEN LAYER */}
      <div 
        className={`absolute inset-0 bg-black transition-all duration-700 ease-in-out z-50 flex items-center justify-center
        ${computerFocused ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-90'}`}
        style={{ pointerEvents: computerFocused ? 'auto' : 'none' }}
      >
          {/* OS CONTENT */}
          <div className="w-full h-full relative chromatic-aberration">
            
            {computerFocused && gameState !== GameState.PLAYING && gameState !== GameState.VICTORY && (
                <button 
                    onClick={() => setComputerFocused(false)}
                    className="absolute top-2 right-2 z-[9999] text-gray-500 hover:text-white text-xs bg-black/50 px-2 cursor-pointer border border-gray-700"
                >
                    [STAND UP]
                </button>
            )}

            {(gameState === GameState.BOOT || gameState === GameState.LOGIN) && (
                <LoginScreen onLogin={handleLogin} />
            )}

            {gameState === GameState.DESKTOP && userProfile && (
                <Desktop 
                    launchGame={launchGameApp} 
                    userProfile={userProfile} 
                    onShutdown={handleShutdown}
                    settings={settings}
                    setSettings={setSettings}
                    fsService={fsService} 
                />
            )}

            {(gameState === GameState.MENU || gameState === GameState.GAME_OVER) && (
                <MainMenu gameState={gameState} startGame={startGame} resetGame={resetGame} />
            )}

            {gameState === GameState.PLAYING && currentLevelGrid.length > 0 && (
                <>
                    <GameScene 
                        gameState={gameState} 
                        setGameState={setGameState} 
                        onStatsChange={handleStatsChange}
                        onMessage={setMessage}
                        onPlayerMove={() => {}} 
                        onInteractUpdate={setInteractLabel}
                        onNoteRead={setNoteContent}
                        mazeGrid={currentLevelGrid}
                        stats={stats}
                    />
                    <UIOverlay 
                        stats={{
                            ...stats, 
                            heartRate: 80, 
                            hasKey: stats.inventory.some(i => i.type === 'KEY'),
                            generatorsActive: worldState.generatorsActive,
                            totalGenerators: 3
                        }} 
                        message={message} 
                        interactLabel={interactLabel}
                        objectives={INITIAL_OBJECTIVES} 
                        mazeGrid={currentLevelGrid} 
                        playerPos={{x:0, z:0, rot:0}}
                    />
                    {noteContent && (
                        <div className="absolute inset-0 z-[99999] bg-black/80 flex items-center justify-center p-8 pointer-events-auto">
                            <div className="bg-[#fffdf0] text-black font-serif p-12 max-w-lg shadow-[0_0_50px_rgba(0,0,0,1)] transform rotate-1 relative flex flex-col">
                                <p className="text-xl mb-8 leading-loose whitespace-pre-line readable-text">{noteContent}</p>
                                <button 
                                    onClick={() => {audioService.playUiClick(); setNoteContent(null);}}
                                    className="bg-black text-white px-6 py-2 font-mono hover:bg-red-900"
                                >
                                    [ CLOSE NOTE ]
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {settings.crtEnabled && gameState !== GameState.VICTORY && (
                <>
                    <div className="pointer-events-none fixed inset-0 z-[500] bg-scanlines opacity-10"></div>
                    <div className="pointer-events-none fixed inset-0 z-[499] vignette"></div>
                    <div className="pointer-events-none fixed inset-0 z-[498] noise"></div>
                </>
            )}
          </div>
      </div>
    </div>
  );
};

export default App;