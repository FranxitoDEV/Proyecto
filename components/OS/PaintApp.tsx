import React, { useRef, useState, useEffect } from 'react';

const PaintApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#000000');
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const c = canvasRef.current;
        if(c) {
            c.width = 600;
            c.height = 400;
            const ctx = c.getContext('2d');
            if(ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0,0,600,400);
            }
        }
    }, []);

    const startDraw = (e: React.MouseEvent) => {
        setIsDrawing(true);
        draw(e);
    };
    
    const stopDraw = () => setIsDrawing(false);

    const draw = (e: React.MouseEvent) => {
        if(!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if(ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = color;
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);

            // Random scary effect
            if(Math.random() > 0.99) {
                ctx.fillStyle = 'red';
                ctx.font = '20px Arial';
                ctx.fillText("HELP", Math.random()*600, Math.random()*400);
            }
        }
    };

    const clear = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if(ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,600,400);
            ctx.beginPath();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-200">
            <div className="flex gap-2 p-2 border-b border-gray-400">
                <div className="flex gap-1">
                    {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffffff'].map(c => (
                        <div 
                            key={c} 
                            className={`w-6 h-6 border-2 border-inset cursor-pointer ${color === c ? 'border-black' : 'border-gray-400'}`}
                            style={{backgroundColor: c}}
                            onClick={() => {setColor(c); if(c === '#000000') { const ctx = canvasRef.current?.getContext('2d'); ctx?.beginPath(); }}}
                        />
                    ))}
                </div>
                <button onClick={clear} className="text-xs border border-gray-500 px-2 bg-gray-100">Clear</button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-500">
                <canvas 
                    ref={canvasRef}
                    className="bg-white cursor-crosshair shadow-lg"
                    onMouseDown={startDraw}
                    onMouseUp={stopDraw}
                    onMouseOut={stopDraw}
                    onMouseMove={draw}
                />
            </div>
        </div>
    );
};

export default PaintApp;