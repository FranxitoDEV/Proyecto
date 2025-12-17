// --- CORE ENUMS ---
export enum GameState {
  BOOT = 'BOOT',
  LOGIN = 'LOGIN',
  ROOM = 'ROOM',      // The Hub (Physical World)
  DESKTOP = 'DESKTOP',// The Interface (Digital World)
  PLAYING = 'PLAYING',// The Maze (Subconscious World)
  MENU = 'MENU',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  BSOD = 'BSOD'
}

export enum ItemType {
  CONSUMABLE = 'CONSUMABLE',
  KEY = 'KEY',
  DATA = 'DATA',
  TOOL = 'TOOL'
}

export enum TileType {
    EMPTY = 0,
    WALL = 1,
    START = 2,
    EXIT = 3,
    KEY = 4,
    GATE = 5,
    BATTERY = 6,
    GENERATOR = 8,
    BLOOD = 9,
    PILLS = 10,
    NOTE = 11,
    ENEMY_SPAWN = 12
}

// --- FILE SYSTEM ARCHITECTURE ---
export type FileType = 'FOLDER' | 'TXT' | 'IMG' | 'EXE' | 'SYS' | 'AUDIO';

export interface VirtualFile {
  id: string;
  parentId: string;
  name: string;
  type: FileType;
  content: string; // URL, Text content, or Binary identifier
  size: number;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
    hidden: boolean;
  };
  metadata?: {
    fearTrigger?: string; // For the dynamic horror system
    questId?: string;     // If interacting with this file advances a quest
  };
}

export interface FileSystemState {
  files: { [id: string]: VirtualFile };
  rootId: string;
}

// --- PLAYER & PROGRESSION ---
export interface PlayerStats {
  // Survival Stats
  sanity: number;      // 0-100. reaching 0 = Game Over
  battery: number;     // 0-100. Flashlight/Deck power.
  stamina: number;     // Physical running capability
  
  // Progression Flags
  clearanceLevel: number; // 0-5. Determines door/file access.
  inventory: InventoryItem[];
  activeEffects: string[]; // 'Adrenaline', 'Sedated', etc.
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quantity: number;
  maxStack: number;
  icon: string;
  description: string;
  onUseAction?: string; // Identifier for the ActionHandler
}

export interface UserProfile {
    username: string;
    fear: string; 
    petName: string;
    isAdmin: boolean;
    themeColor: string;
    bestFriend?: string;
    livesAlone?: boolean;
    favoriteColor?: string;
    created?: boolean;
}

export interface AppSettings {
    volume: number;
    sensitivity: number;
    crtEnabled: boolean;
    brightness: number;
}

// --- QUEST & WORLD STATE ---
export interface WorldState {
    generatorsActive: number;
    doorsUnlocked: string[];
    enemiesActive: boolean;
    threatLevel: number; // 0-10. Controls AI aggression.
}

export type Objective = {
  id: string;
  text: string;
  completed: boolean;
  requiredFor: string[]; // Dependency graph for objectives
};

export interface LevelConfig {
    width: number;
    height: number;
    difficulty: number;
    seed: number;
}