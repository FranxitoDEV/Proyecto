import { FileSystemState, VirtualFile, FileType } from '../types';

// Initial State Factory
export const createInitialFileSystem = (username: string): FileSystemState => {
    const files: { [id: string]: VirtualFile } = {};

    const addFile = (id: string, parentId: string, name: string, type: FileType, content: string, locked = false) => {
        files[id] = {
            id,
            parentId,
            name,
            type,
            content,
            size: Math.floor(Math.random() * 1024),
            permissions: { read: true, write: !locked, execute: type === 'EXE', hidden: false }
        };
    };

    // ROOT
    addFile('root', '', 'C:', 'FOLDER', '');
    
    // SYSTEM
    addFile('sys', 'root', 'SYSTEM', 'FOLDER', '', true);
    addFile('sys_kernel', 'sys', 'kernel.dll', 'SYS', 'BINARY', true);
    addFile('sys_boot', 'sys', 'boot.ini', 'SYS', '[BOOT LOADER]\ntimeout=0', true);

    // USERS
    addFile('users', 'root', 'USERS', 'FOLDER', '', true);
    addFile('user_home', 'users', username.toUpperCase(), 'FOLDER', '');
    
    // DOCS
    addFile('docs', 'user_home', 'DOCUMENTS', 'FOLDER', '');
    addFile('note_intro', 'docs', 'README.txt', 'TXT', 'Welcome to the MNEMOSYNE Recovery Console.\nUse the map to locate fragments.');
    
    // BIN (Programs)
    addFile('bin', 'root', 'BIN', 'FOLDER', '', true);
    addFile('game_exe', 'bin', 'RECOVERY.EXE', 'EXE', 'LAUNCH_GAME');
    addFile('cam_exe', 'bin', 'CAMS.EXE', 'EXE', 'LAUNCH_CAMS');

    // TRASH
    addFile('trash', 'root', 'RECYCLE BIN', 'FOLDER', '');

    return { files, rootId: 'root' };
};

export class FileSystemService {
    private state: FileSystemState;
    private listeners: ((state: FileSystemState) => void)[] = [];

    constructor(initialState: FileSystemState) {
        this.state = initialState;
    }

    getState() {
        return this.state;
    }

    subscribe(listener: (state: FileSystemState) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }

    // Operations
    getFolderContents(folderId: string): VirtualFile[] {
        return Object.values(this.state.files).filter(f => f.parentId === folderId);
    }

    deleteFile(fileId: string): boolean {
        const file = this.state.files[fileId];
        if (!file || !file.permissions.write) return false;
        
        // If folder, recursive delete check could go here
        delete this.state.files[fileId];
        this.notify();
        return true;
    }

    createFile(parentId: string, name: string, type: FileType, content: string): VirtualFile {
        const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newFile: VirtualFile = {
            id,
            parentId,
            name,
            type,
            content,
            size: 0,
            permissions: { read: true, write: true, execute: type === 'EXE', hidden: false }
        };
        this.state.files[id] = newFile;
        this.notify();
        return newFile;
    }
}