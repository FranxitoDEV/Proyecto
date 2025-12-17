import React, { useState } from 'react';

const Minesweeper = () => {
    const [grid, setGrid] = useState<number[]>(Array(64).fill(0).map(() => Math.random() < 0.15 ? -1 : 0));
    const [revealed, setRevealed] = useState<boolean[]>(Array(64).fill(false));
    const [dead, setDead] = useState(false);

    const handleClick = (i: number) => {
        if (dead || revealed[i]) return;
        const newRev = [...revealed];
        newRev[i] = true;
        setRevealed(newRev);

        if (grid[i] === -1) {
            setDead(true);
        }
    };

    return (
        <div className="w-full h-full bg-gray-300 p-2 flex flex-col items-center">
             <div className="mb-2 border-2 border-gray-500 p-1 bg-black text-red-500 font-mono text-xl">
                 {dead ? 'X_X' : '000'}
             </div>
             <div className="grid grid-cols-8 gap-0 border-4 border-gray-400 border-l-white border-t-white">
                 {grid.map((cell, i) => (
                     <div 
                        key={i} 
                        className={`w-6 h-6 border flex items-center justify-center text-xs font-bold cursor-pointer
                            ${revealed[i] 
                                ? 'border-gray-500 border-t-black border-l-black bg-gray-200' 
                                : 'border-white border-b-black border-r-black bg-gray-300'
                            }
                        `}
                        onClick={() => handleClick(i)}
                     >
                         {revealed[i] ? (cell === -1 ? '💣' : (cell > 0 ? cell : '')) : ''}
                     </div>
                 ))}
             </div>
             {dead && <div className="mt-2 text-red-600 font-bold text-xs">GAME OVER</div>}
        </div>
    );
};

export default Minesweeper;