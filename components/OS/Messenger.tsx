import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { generateChatResponse } from '../../services/geminiService';

interface Message {
    sender: 'user' | 'unknown';
    text: string;
}

const Messenger: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'unknown', text: '...is anyone there?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);
        audioService.playUiClick();

        // Simulate network delay + AI generation
        setTimeout(async () => {
            const reply = await generateChatResponse(userMsg);
            setMessages(prev => [...prev, { sender: 'unknown', text: reply }]);
            audioService.playProximityStatic(5); // Eerie sound on receive
            setLoading(false);
        }, 1500 + Math.random() * 1000);
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-200 text-sm font-sans">
            <div className="bg-blue-900 text-white p-1 font-bold flex justify-between">
                <span>Instant Messenger</span>
                <span>ONLINE</span>
            </div>
            
            <div className="flex-1 overflow-auto p-2 bg-white border-2 border-gray-400 inset-shadow flex flex-col gap-2">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-1 px-2 border ${m.sender === 'user' ? 'bg-yellow-100 border-yellow-300' : 'bg-gray-100 border-gray-300'}`}>
                            <span className="font-bold text-xs block text-gray-500">{m.sender === 'user' ? 'You' : 'Unknown'}:</span>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-gray-400 italic text-xs">Unknown is typing...</div>}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-2 flex gap-2 border-t border-gray-400">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 border border-gray-500 px-1"
                    placeholder="Type a message..."
                />
                <button type="submit" className="px-3 bg-gray-300 border-2 border-white border-b-black border-r-black font-bold">Send</button>
            </form>
        </div>
    );
};

export default Messenger;