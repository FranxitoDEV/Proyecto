import React, { useState, useEffect } from 'react';
import Browser from './Browser';
import EmailClient from './EmailClient';
import Terminal from './Terminal';
import FileManager from './FileManager';
import CameraViewer from './CameraViewer';
import { AppSettings, UserProfile } from '../../types';
import { audioService } from '../../services/audioService';
import { FileSystemService } from '../../services/FileSystemService';

interface DesktopProps {
  launchGame: () => void;
  userProfile: UserProfile;
  onShutdown: () => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  fsService: FileSystemService;
}

// --- SETTINGS ---
const SettingsApp: React.FC<{settings: AppSettings, setSettings: (s: AppSettings) => void}> = ({settings, setSettings}) => {
    return (
        <div className="p-6 bg-gray-200 h-full flex flex-col gap-6 text-xl text-black">
            <h2 className="font-bold border-b border-gray-400">Control Panel</h2>
            <div className="flex flex-col gap-2">
                <label className="font-bold">Master Volume</label>
                <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={settings.volume} 
                    onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setSettings({...settings, volume: v});
                        audioService.setVolume(v);
                    }}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="font-bold">Brightness (Gamma)</label>
                <input 
                    type="range" min="0.5" max="2" step="0.1" 
                    value={settings.brightness} 
                    onChange={(e) => setSettings({...settings, brightness: parseFloat(e.target.value)})}
                />
            </div>
            <div className="flex gap-2 items-center">
                 <input type="checkbox" checked={settings.crtEnabled} onChange={e => setSettings({...settings, crtEnabled: e.target.checked})} />
                 <label>Enable CRT Effects</label>
            </div>
        </div>
    );
};

const Desktop: React.FC<DesktopProps> = ({ launchGame, userProfile, onShutdown, settings, setSettings, fsService }) => {
  const [windows, setWindows] = useState<{id: string, title: string, content: React.ReactNode, x: number, y: number, w: number, h: number, minimized: boolean}[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [dragInfo, setDragInfo] = useState<{id: string, offX: number, offY: number} | null>(null);
  
  const [trashLabel, setTrashLabel] = useState("Recycle Bin");
  const [trashIcon, setTrashIcon] = useState("🗑️");

  useEffect(() => {
      audioService.playAmbientDrone();
      const hddInterval = setInterval(() => audioService.playHDDNoise(), 12000); 
      return () => clearInterval(hddInterval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    const mouseUp = () => setDragInfo(null);
    const mouseMove = (e: MouseEvent) => {
        if(dragInfo) {
            setWindows(prev => prev.map(w => {
                if(w.id === dragInfo.id) {
                    return {...w, x: e.clientX - dragInfo.offX, y: e.clientY - dragInfo.offY};
                }
                return w;
            }));
        }
    };
    window.addEventListener('mouseup', mouseUp);
    window.addEventListener('mousemove', mouseMove);
    return () => {
        clearInterval(t);
        window.removeEventListener('mouseup', mouseUp);
        window.removeEventListener('mousemove', mouseMove);
    };
  }, [dragInfo]);

  const openWindow = (id: string, title: string, content: React.ReactNode, w=600, h=450) => {
    audioService.playWindowOpen();
    if (windows.find(win => win.id === id)) {
        setActiveId(id);
        setWindows(prev => prev.map(win => win.id === id ? {...win, minimized: false} : win));
        return;
    }
    setWindows([...windows, { id, title, content, x: 50 + (windows.length*20), y: 50 + (windows.length*20), w, h, minimized: false }]);
    setActiveId(id);
    setStartOpen(false);
  };

  const closeWindow = (id: string) => {
    audioService.playUiClick();
    setWindows(windows.filter(w => w.id !== id));
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
      setActiveId(id);
      const win = windows.find(w => w.id === id);
      if(win) setDragInfo({id, offX: e.clientX - win.x, offY: e.clientY - win.y});
  };

  return (
    <div 
        className="absolute inset-0 w-full h-full overflow-hidden font-sans select-none pointer-events-auto"
        style={{backgroundColor: userProfile.themeColor}}
    >
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pixels.png')] pointer-events-none"></div>

        {/* --- DESKTOP ICONS --- */}
        <div className="absolute top-4 left-4 grid grid-flow-col grid-rows-6 gap-8 z-0 content-start">
            
            <DesktopIcon label="My Documents" icon="📁" onDblClick={() => openWindow('comp', 'My Documents', <FileManager userProfile={userProfile} fsService={fsService} />)} />
            <DesktopIcon label="Outlook" icon="📧" onDblClick={() => openWindow('mail', 'Outlook Express', <EmailClient userProfile={userProfile} />, 700, 500)} />
            <DesktopIcon label={trashLabel} icon={trashIcon} onDblClick={() => openWindow('trash', 'Recycle Bin', <FileManager userProfile={userProfile} fsService={fsService} />)} />
            <DesktopIcon label="Network" icon="🌐" onDblClick={() => openWindow('browser', 'Giggle Intranet', <Browser />, 800, 600)} />
            
            <div className="mt-8"></div> {/* Spacer */}

            <DesktopIcon label="RECOVERY_TOOL" icon="☢️" color="text-yellow-400 font-bold" onDblClick={launchGame} />
            <DesktopIcon label="CamLink v1.0" icon="📹" onDblClick={() => openWindow('cams', 'Facility Feeds', <CameraViewer />, 650, 520)} />
            
            {userProfile.isAdmin && (
                <DesktopIcon label="CMD" icon="📟" onDblClick={() => openWindow('term', 'Command Prompt', <Terminal />, 600, 400)} />
            )}
             <DesktopIcon label="Settings" icon="⚙️" onDblClick={() => openWindow('settings', 'Control Panel', <SettingsApp settings={settings} setSettings={setSettings}/>)} />
        </div>

        {/* --- WINDOW MANAGER --- */}
        {windows.map(win => !win.minimized && (
            <div 
                key={win.id}
                className="absolute bg-gray-200 border-2 border-white border-b-black border-r-black shadow-2xl flex flex-col"
                style={{ top: win.y, left: win.x, width: win.w, height: win.h, zIndex: activeId === win.id ? 50 : 10 }}
                onMouseDown={() => setActiveId(win.id)}
            >
                <div 
                    className={`h-8 px-2 flex justify-between items-center select-none cursor-grab active:cursor-grabbing ${activeId === win.id ? 'bg-blue-900 text-white' : 'bg-gray-400 text-gray-700'}`}
                    onMouseDown={(e) => startDrag(e, win.id)}
                >
                    <div className="font-bold text-sm truncate flex gap-2 items-center">
                        <span className="text-xs">🪟</span>
                        {win.title}
                    </div>
                    <div className="flex gap-1">
                         <button onClick={(e) => {e.stopPropagation(); setWindows(prev => prev.map(w => w.id === win.id ? {...w, minimized: true} : w))}} className="w-5 h-5 bg-gray-300 text-black border border-white border-b-black border-r-black flex items-center justify-center font-bold text-xs hover:bg-gray-400">_</button>
                        <button onClick={(e) => {e.stopPropagation(); closeWindow(win.id)}} className="w-5 h-5 bg-gray-300 text-black border border-white border-b-black border-r-black flex items-center justify-center font-bold text-xs hover:bg-red-600 hover:text-white">X</button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-white border border-gray-500 relative">
                    {win.content}
                </div>
            </div>
        ))}

        {/* --- TASKBAR --- */}
        <div className="absolute bottom-0 w-full h-10 bg-gray-300 border-t-2 border-white flex justify-between items-center p-1 z-[100]">
            <button 
                className={`h-full px-2 flex gap-2 items-center font-bold border-2 border-white border-b-black border-r-black ${startOpen ? 'bg-gray-400 border-black border-b-white border-r-white' : 'bg-gray-300'}`}
                onClick={() => {audioService.playUiClick(); setStartOpen(!startOpen);}}
            >
                <img src="https://win98icons.alexmeub.com/icons/png/windows-0.png" className="w-5 h-5" /> 
                <span className="text-black text-sm">Start</span>
            </button>
            <div className="flex-1 mx-2 flex gap-1 overflow-hidden">
                {windows.map(w => (
                    <button 
                        key={w.id}
                        className={`w-32 h-full border-2 px-2 text-left truncate flex items-center gap-2 text-xs font-bold ${activeId === w.id && !w.minimized ? 'bg-gray-200 border-black border-b-white border-r-white' : 'bg-gray-300 border-white border-b-black border-r-black'}`}
                        onClick={() => {
                             setActiveId(w.id);
                             setWindows(prev => prev.map(win => win.id === w.id ? {...win, minimized: false} : win));
                        }}
                    >
                        <span>{w.title}</span>
                    </button>
                ))}
            </div>
            <div className="h-full px-2 border-2 border-gray-500 border-b-white border-r-white bg-gray-300 flex items-center text-sm gap-2 text-black">
                <span>🔊</span>
                <span>{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>

        {/* --- START MENU --- */}
        {startOpen && (
            <div className="absolute bottom-10 left-0 w-48 bg-gray-200 border-2 border-white border-b-black border-r-black z-[100] shadow-xl flex">
                <div className="w-6 bg-gray-700 text-white flex items-end justify-center py-2"><span className="-rotate-90 text-sm font-bold tracking-widest whitespace-nowrap">MNEMOSYNE</span></div>
                <div className="flex-1 py-1 text-black">
                    <MenuItem label="Recovery Tool" icon="☢️" onClick={launchGame} />
                    <MenuItem label="My Documents" icon="📁" onClick={() => openWindow('comp', 'My Documents', <FileManager userProfile={userProfile} fsService={fsService} />)}/>
                    <MenuItem label="Security Feeds" icon="📹" onClick={() => openWindow('cams', 'Facility Feeds', <CameraViewer />, 650, 520)}/>
                    <div className="border-b border-gray-400 my-1"></div>
                    <MenuItem label="Settings" icon="⚙️" onClick={() => openWindow('settings', 'Control Panel', <SettingsApp settings={settings} setSettings={setSettings}/>)} />
                    <MenuItem label="Log Off..." icon="🔑" onClick={() => { audioService.playUiClick(); onShutdown(); }} />
                </div>
            </div>
        )}
    </div>
  );
};

const DesktopIcon: React.FC<{label: string, icon: string, color?: string, onDblClick: () => void}> = ({label, icon, color, onDblClick}) => (
    <div 
        className="w-20 flex flex-col items-center gap-1 cursor-pointer group hover:bg-blue-800/20 p-1 border border-transparent hover:border-blue-200/20"
        onClick={() => audioService.playUiClick()}
        onDoubleClick={onDblClick}
    >
        <div className="text-4xl drop-shadow-md filter">{icon}</div>
        <span className={`text-center text-white px-1 text-xs leading-tight ${color ? color : 'text-white'}`} style={{textShadow: '1px 1px 1px black'}}>{label}</span>
    </div>
);

const MenuItem: React.FC<{label: string, icon: string, onClick?: () => void}> = ({label, icon, onClick}) => (
    <div className="px-2 py-1 hover:bg-blue-800 hover:text-white flex gap-2 cursor-pointer items-center text-sm" onClick={onClick}>
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
    </div>
);

export default Desktop;