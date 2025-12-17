import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { UserProfile, FileSystemState, VirtualFile } from '../../types';
import { FileSystemService } from '../../services/FileSystemService';

interface FileManagerProps {
    userProfile: UserProfile;
    fsService: FileSystemService; // Injected dependency
}

const FileManager: React.FC<FileManagerProps> = ({ userProfile, fsService }) => {
    const [fsState, setFsState] = useState<FileSystemState>(fsService.getState());
    const [currentPathId, setCurrentPathId] = useState<string>('root');
    const [history, setHistory] = useState<string[]>(['root']);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = fsService.subscribe(setFsState);
        return unsubscribe;
    }, [fsService]);

    const currentFiles = fsService.getFolderContents(currentPathId);
    const currentFolder = fsState.files[currentPathId];

    const handleOpen = (file: VirtualFile) => {
        if (file.type === 'FOLDER') {
            audioService.playUiClick();
            setHistory([...history, file.id]);
            setCurrentPathId(file.id);
            setSelectedId(null);
        } else if (file.type === 'EXE') {
            audioService.playError();
            alert("Cannot execute binary from File Manager.");
        } else {
            audioService.playWindowOpen();
            // In a real implementation, this would open a specific viewer window
            alert(`OPENING: ${file.name}\n\n${file.content}`);
        }
    };

    const handleBack = () => {
        if (history.length > 1) {
            audioService.playUiClick();
            const newHistory = [...history];
            newHistory.pop();
            setHistory(newHistory);
            setCurrentPathId(newHistory[newHistory.length - 1]);
            setSelectedId(null);
        }
    };

    const handleDelete = () => {
        if (selectedId) {
            const success = fsService.deleteFile(selectedId);
            if (success) {
                audioService.playUiClick();
                setSelectedId(null);
            } else {
                audioService.playError();
            }
        }
    };

    // Calculate path string for display
    const getPathString = () => {
        // This is a simplified path builder
        return currentFolder ? currentFolder.name : 'UNKNOWN';
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 font-sans text-sm text-black relative">
            {/* Toolbar */}
            <div className="bg-gray-200 p-2 border-b border-gray-400 flex gap-2">
                <button onClick={handleBack} disabled={history.length <= 1} className="px-3 border border-gray-500 bg-gray-100 disabled:opacity-50">Up</button>
                <button onClick={handleDelete} disabled={!selectedId} className="px-3 border border-gray-500 bg-gray-100 text-red-900 font-bold hover:bg-red-100 disabled:opacity-50">Delete</button>
                <div className="flex-1 bg-white border border-gray-500 px-2 flex items-center font-mono">
                    {getPathString()}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 flex content-start flex-wrap gap-4 bg-white">
                {currentFiles.map(file => (
                    <div 
                        key={file.id}
                        className={`w-20 flex flex-col items-center gap-1 cursor-pointer p-1 border ${selectedId === file.id ? 'bg-blue-600 text-white border-blue-600 border-dotted' : 'border-transparent hover:bg-gray-100'}`}
                        onClick={() => setSelectedId(file.id)}
                        onDoubleClick={() => handleOpen(file)}
                    >
                        <div className="text-4xl">
                            {file.type === 'FOLDER' ? '📁' : 
                             file.type === 'TXT' ? '📄' : 
                             file.type === 'IMG' ? '🖼️' : 
                             file.type === 'EXE' ? '⚙️' : '🧱'}
                        </div>
                        <span className="text-center text-xs break-all leading-tight">{file.name}</span>
                    </div>
                ))}
                
                {currentFiles.length === 0 && (
                    <div className="text-gray-400 w-full text-center mt-10">Folder is empty.</div>
                )}
            </div>
            
            {/* Status Bar */}
            <div className="bg-gray-200 border-t border-gray-400 p-1 text-xs">
                {currentFiles.length} object(s)
            </div>
        </div>
    );
};

export default FileManager;