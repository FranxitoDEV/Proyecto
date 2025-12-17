import React, { useState } from 'react';
import { audioService } from '../../services/audioService';

const Browser: React.FC = () => {
    const [url, setUrl] = useState('www.giggle.com');
    const [page, setPage] = useState('home'); // home, search, news, error
    const [activeTab, setActiveTab] = useState(0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        audioService.playUiClick();
        setPage('search');
    };

    const navigate = (p: string, u: string) => {
        setPage(p);
        setUrl(u);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 font-sans text-black">
            {/* Tabs */}
            <div className="flex bg-gray-300 pt-1 px-1 gap-1 border-b border-gray-400">
                <div className={`px-4 py-1 rounded-t-lg text-sm border-t border-l border-r border-gray-500 cursor-pointer ${activeTab === 0 ? 'bg-white font-bold' : 'bg-gray-200'}`} onClick={() => setActiveTab(0)}>Giggle</div>
                <div className={`px-4 py-1 rounded-t-lg text-sm border-t border-l border-r border-gray-500 cursor-pointer ${activeTab === 1 ? 'bg-white font-bold' : 'bg-gray-200'}`} onClick={() => setActiveTab(1)}>TruthSeekers</div>
                <div className={`px-4 py-1 rounded-t-lg text-sm border-t border-l border-r border-gray-500 cursor-pointer ${activeTab === 2 ? 'bg-black text-red-600 font-bold border-red-900' : 'bg-gray-200'}`} onClick={() => setActiveTab(2)}>DEEP_NET</div>
            </div>

            {/* Address Bar */}
            <div className="bg-gray-200 p-2 border-b border-gray-400 flex gap-2 items-center">
                <button className="px-2 border bg-gray-100" onClick={() => navigate('home', 'www.giggle.com')}>🏠</button>
                <input type="text" value={activeTab === 2 ? '66.6.6.6/index.html' : url} readOnly className={`flex-1 border px-2 ${activeTab === 2 ? 'bg-black text-red-500 font-mono' : 'bg-white'}`} />
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-auto p-4 ${activeTab === 2 ? 'bg-black text-green-500 font-mono' : 'bg-white'}`}>
                {activeTab === 0 && page === 'home' && (
                    <div className="flex flex-col items-center mt-8">
                        <h1 className="text-5xl font-bold mb-4 text-blue-600"><span className="text-red-500">G</span>iggl<span className="text-yellow-500">e</span></h1>
                        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
                            <input type="text" className="flex-1 border-2 border-blue-300 p-1" placeholder="Search..." />
                            <button className="bg-gray-200 px-4 border">Go</button>
                        </form>
                        <div className="mt-12 text-center">
                            <h3 className="font-bold border-b mb-2">Top Stories</h3>
                            <a className="block text-blue-700 underline cursor-pointer hover:text-red-600" onClick={() => navigate('news', 'news.com/accident')}>
                                Tragic Car Accident claims life of... [REDACTED]
                            </a>
                        </div>
                    </div>
                )}

                {activeTab === 0 && page === 'search' && (
                    <div>
                        <div className="text-xs text-gray-500 mb-4">Results: 0</div>
                        <div className="text-red-600 font-bold">ERROR 404: REALITY NOT FOUND</div>
                        <p>The system cannot find the file specified.</p>
                    </div>
                )}

                {activeTab === 0 && page === 'news' && (
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-2xl font-bold mb-2">Fatal Crash on Route 66</h1>
                        <div className="bg-black w-full h-48 mb-4 flex items-center justify-center text-white">IMAGE REDACTED</div>
                        <p className="mb-4">
                            Police are still investigating the single-vehicle crash that occurred last night.
                            The driver, identified only as "Subject 7", was transported to the Mnemosyne Research Facility.
                        </p>
                        <p className="font-bold italic text-red-800">
                            "There was nobody in the car when we got there," says Officer Kogan.
                        </p>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="font-mono text-sm">
                        <h1 className="text-xl bg-blue-900 text-white p-2 mb-4">TruthSeekers > General > The Facility</h1>
                        <div className="border mb-4 p-2 bg-gray-50">
                            <div className="font-bold text-blue-800">User: Watcher99</div>
                            <p>Has anyone else noticed the humming sound coming from the old hospital? My dog won't go near it.</p>
                        </div>
                        <div className="border mb-4 p-2 bg-gray-50">
                            <div className="font-bold text-red-800">User: Admin</div>
                            <p>This thread has been locked. Stop asking questions.</p>
                        </div>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="p-4">
                        <h1 className="text-4xl text-red-600 font-bold mb-8 animate-pulse">THE ARCHIVE</h1>
                        <ul className="list-disc pl-6 space-y-4">
                            <li><span className="text-white">PROJECT_MNEMOSYNE.TXT</span> - <span className="text-gray-500">CORRUPTED</span></li>
                            <li><span className="text-white">PATIENT_LIST.DAT</span> - <span className="text-gray-500">ENCRYPTED</span></li>
                            <li>
                                <span className="text-white">LOG_ENTRY_404.TXT</span>
                                <div className="mt-2 text-xs border border-green-800 p-2 text-green-300">
                                    "We tried to erase the trauma. Instead, we gave it form. It's not a simulation anymore. It's a cage."
                                </div>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Browser;