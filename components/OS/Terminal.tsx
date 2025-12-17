import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';

const FILES_SYSTEM = {
    'home': ['user', 'bin', 'etc'],
    'user': ['documents', 'downloads', 'secret.enc'],
    'bin': ['run_maze.exe', 'decrypt.exe'],
    'etc': ['passwd', 'hosts']
};

const Terminal: React.FC = () => {
    const [history, setHistory] = useState<string[]>(["MNEMOSYNE OS v1.0", "Copyright (c) 1996", "Type 'help' for commands."]);
    const [input, setInput] = useState('');
    const [path, setPath] = useState('C:\\HOME');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = input.trim().toLowerCase();
        const parts = cmd.split(' ');
        
        audioService.playUiClick();
        
        const newHistory = [...history, `${path}> ${input}`];

        switch(parts[0]) {
            case 'help':
                newHistory.push("AVAILABLE COMMANDS: DIR, CD, CLS, HELP, WHOAMI, EXIT, DECRYPT");
                break;
            case 'dir':
            case 'ls':
                newHistory.push("  <DIR> .");
                newHistory.push("  <DIR> ..");
                newHistory.push("  FILE  SYSTEM.LOG");
                newHistory.push("  FILE  GHOST_DATA.DAT");
                break;
            case 'whoami':
                newHistory.push("USER: ADMIN (UNAUTHORIZED)");
                break;
            case 'cls':
            case 'clear':
                setHistory([]);
                setInput('');
                return;
            case 'decrypt':
                newHistory.push("ACCESS DENIED. ENCRYPTION LEVEL: PSYCHE-5");
                break;
            case 'exit':
                newHistory.push("TERMINATING SESSION...");
                break;
            default:
                if (cmd.length > 0) newHistory.push(`'${cmd}' is not recognized as an internal or external command.`);
        }

        setHistory(newHistory);
        setInput('');
    };

    return (
        <div className="w-full h-full bg-black text-green-500 font-mono p-2 text-sm overflow-auto" onClick={() => document.getElementById('term-input')?.focus()}>
            {history.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
            ))}
            <form onSubmit={handleCommand} className="flex">
                <span>{path}&gt;&nbsp;</span>
                <input 
                    id="term-input"
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-transparent border-none outline-none text-green-500 flex-1 caret-green-500"
                    autoFocus
                    autoComplete="off"
                />
            </form>
            <div ref={bottomRef} />
        </div>
    );
};

export default Terminal;