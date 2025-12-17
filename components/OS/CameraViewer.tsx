import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';

const CameraViewer: React.FC = () => {
    const [cam, setCam] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            renderStatic();
        }, 100);
        return () => clearInterval(interval);
    }, [cam]);

    const renderStatic = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Base dark
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // "Camera" view - very abstract drawing based on room scene
        ctx.strokeStyle = '#334433';
        ctx.lineWidth = 2;
        
        if (cam === 1) { // Room corner
            ctx.strokeRect(50, 100, 100, 200); // Wardrobe
            ctx.strokeRect(200, 250, 300, 50); // Bed
            ctx.fillStyle = '#050505';
            ctx.font = "20px monospace";
            ctx.fillStyle = "white";
            ctx.fillText("CAM 01: BEDROOM", 20, 30);
        } else if (cam === 2) { // Door
             ctx.strokeRect(250, 50, 100, 250); // Door
             ctx.fillStyle = "white";
             ctx.fillText("CAM 02: HALLWAY", 20, 30);
             // Creepy figure check
             if (Math.random() > 0.95) {
                 ctx.fillStyle = 'black';
                 ctx.beginPath();
                 ctx.arc(300, 150, 15, 0, Math.PI*2); // Head
                 ctx.fill();
                 ctx.fillRect(290, 165, 20, 50); // Body
             }
        }

        // Noise
        const idata = ctx.getImageData(0, 0, w, h);
        const buffer32 = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buffer32.length; i++) {
            if (Math.random() < 0.2) {
                buffer32[i] = ((255 * Math.random()) | 0) << 24; // Noise
            }
        }
        ctx.putImageData(idata, 0, 0);

        // Scanline
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(0, (Date.now() / 10) % h, w, 2);
    };

    return (
        <div className="flex flex-col h-full bg-black border-4 border-gray-600">
            <div className="flex bg-gray-800 p-2 gap-2">
                <button onClick={() => { setCam(1); audioService.playUiClick(); }} className={`px-4 py-1 text-xs font-mono border ${cam === 1 ? 'bg-red-900 text-white' : 'bg-gray-300'}`}>CAM 01</button>
                <button onClick={() => { setCam(2); audioService.playUiClick(); }} className={`px-4 py-1 text-xs font-mono border ${cam === 2 ? 'bg-red-900 text-white' : 'bg-gray-300'}`}>CAM 02</button>
                <div className="flex-1 text-right text-red-500 animate-pulse font-mono">REC ●</div>
            </div>
            <div className="flex-1 relative">
                <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-fill" />
            </div>
        </div>
    );
};

export default CameraViewer;