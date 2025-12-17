import React, { useState, useEffect } from 'react';
import { Objective } from '../types';

interface UIOverlayProps {
  stats: { 
      sanity: number; 
      stamina: number; 
      heartRate: number;
      hasKey: boolean; 
      generatorsActive: number; 
      totalGenerators: number;
  };
  message: string | null;
  interactLabel: string | null;
  objectives: Objective[];
  mazeGrid: number[][];
  playerPos: { x: number; z: number; rot: number };
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, message, interactLabel, objectives }) => {
  const isPanic = stats.sanity < 40;

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 font-retro flex flex-col justify-between p-6 ${isPanic ? 'panic-mode' : ''}`}>
        
        {/* TOP BAR */}
        <div className="flex justify-between items-start">
             <div className="flex flex-col gap-1 w-64">
                 <div className="text-red-600 font-bold text-xl tracking-widest bg-black/50 px-2 flex justify-between">
                     <span>REC ●</span>
                     <span>{new Date().toLocaleTimeString()}</span>
                 </div>
                 {/* LOG CONSOLE */}
                 <div className="font-mono text-xs text-green-600 bg-black/80 p-2 h-24 overflow-hidden opacity-70">
                     > SYSTEM_INIT... OK<br/>
                     > BIO_READING: {Math.round(stats.heartRate)} BPM<br/>
                     > CORTEX_SYNC: {Math.round(stats.sanity)}%<br/>
                     {stats.sanity < 30 && <span className="text-red-500 animate-pulse">> CRITICAL: SANITY LOSS<br/></span>}
                     <span className="animate-pulse">> _</span>
                 </div>
             </div>
             
             {/* OBJECTIVES */}
             <div className="bg-black/60 border-l-2 border-white p-4 text-right">
                 {objectives.map(o => (
                     <div key={o.id} className={`text-lg ${o.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                         {o.text}
                     </div>
                 ))}
                 <div className="text-yellow-500 mt-1">GENS: {stats.generatorsActive}/{stats.totalGenerators}</div>
                 <div className="mt-4 text-xs text-gray-400">HOLD [SPACE] TO CLOSE EYES</div>
             </div>
        </div>
        
        {/* CENTER INTERACT */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <div className={`w-1 h-1 bg-white rounded-full opacity-50`} />
                {interactLabel && (
                    <div className="bg-black/80 text-white px-3 py-1 border border-white text-xl animate-bounce">
                        {interactLabel}
                    </div>
                )}
        </div>

        {/* CENTER MESSAGE */}
        {message && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20">
                <div className="text-red-600 font-bold text-6xl text-shadow-glow animate-pulse tracking-widest text-center">
                    {message}
                </div>
            </div>
        )}

        {/* BOTTOM STATS */}
        <div className="flex justify-between items-end">
            <div className="text-xs text-gray-500 font-mono">
                    [WASD] MOVE | [SHIFT] RUN | [SPACE] HIDE (CLOSE EYES)
            </div>

            {/* STATUS BARS */}
            <div className="flex gap-8 mb-4">
                <div className="flex flex-col items-center">
                    <span className="text-2xl text-red-500">🧠</span>
                    <div className="w-8 h-32 bg-gray-800 border border-gray-500 relative flex flex-col-reverse">
                        <div 
                            className={`w-full transition-all ${stats.sanity < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`} 
                            style={{height: `${stats.sanity}%`}} 
                        />
                    </div>
                    <span className="text-xs text-gray-400 mt-1">SANITY</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UIOverlay;