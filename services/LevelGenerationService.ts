import { TileType, LevelConfig } from '../types';

export class LevelGenerationService {
    
    // Generates a 2D grid level
    public generateLevel(config: LevelConfig): number[][] {
        const { width, height } = config;
        
        // 1. Initialize full wall grid
        // Ensure dimensions are odd for the algorithm to work best with walls between cells
        const w = width % 2 === 0 ? width + 1 : width;
        const h = height % 2 === 0 ? height + 1 : height;
        
        let grid: number[][] = Array(h).fill(null).map(() => Array(w).fill(TileType.WALL));

        // 2. Recursive Backtracker for Maze
        const stack: {x: number, y: number}[] = [];
        const startX = 1;
        const startY = 1;
        
        grid[startY][startX] = TileType.EMPTY;
        stack.push({x: startX, y: startY});

        while(stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y, grid, w, h);

            if(neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                // Remove wall between
                grid[(current.y + next.y)/2][(current.x + next.x)/2] = TileType.EMPTY;
                // Mark next as visited (empty)
                grid[next.y][next.x] = TileType.EMPTY;
                stack.push(next);
            } else {
                stack.pop();
            }
        }

        // 3. Post-Processing: Create Loops (remove dead ends randomly)
        // This makes the map less linear and more dangerous
        for(let y = 1; y < h-1; y++) {
            for(let x = 1; x < w-1; x++) {
                if(grid[y][x] === TileType.WALL) {
                    // If it separates two empty spaces, 10% chance to break wall
                    let neighbors = 0;
                    if(grid[y+1][x] === TileType.EMPTY) neighbors++;
                    if(grid[y-1][x] === TileType.EMPTY) neighbors++;
                    if(grid[y][x+1] === TileType.EMPTY) neighbors++;
                    if(grid[y][x-1] === TileType.EMPTY) neighbors++;
                    
                    if(neighbors >= 2 && Math.random() < 0.1) {
                        grid[y][x] = TileType.EMPTY;
                    }
                }
            }
        }

        // 4. Place Entities
        this.placeFeature(grid, TileType.START, 1);
        this.placeFeature(grid, TileType.GENERATOR, 3); // 3 Generators
        this.placeFeature(grid, TileType.KEY, 1);
        this.placeFeature(grid, TileType.BATTERY, 4);
        this.placeFeature(grid, TileType.NOTE, 2);
        this.placeFeature(grid, TileType.ENEMY_SPAWN, 1);

        return grid;
    }

    private getUnvisitedNeighbors(x: number, y: number, grid: number[][], w: number, h: number) {
        const neighbors = [];
        const directions = [
            {dx: 0, dy: -2}, // Up
            {dx: 2, dy: 0},  // Right
            {dx: 0, dy: 2},  // Down
            {dx: -2, dy: 0}  // Left
        ];

        for(const d of directions) {
            const nx = x + d.dx;
            const ny = y + d.dy;
            
            if(nx > 0 && nx < w && ny > 0 && ny < h && grid[ny][nx] === TileType.WALL) {
                neighbors.push({x: nx, y: ny});
            }
        }
        return neighbors;
    }

    private placeFeature(grid: number[][], type: TileType, count: number) {
        let placed = 0;
        const h = grid.length;
        const w = grid[0].length;
        
        while(placed < count) {
            const x = Math.floor(Math.random() * (w - 2)) + 1;
            const y = Math.floor(Math.random() * (h - 2)) + 1;
            
            if(grid[y][x] === TileType.EMPTY) {
                // Ensure we don't block start position logic (usually 1,1)
                if (x < 3 && y < 3 && type !== TileType.START) continue; 
                
                grid[y][x] = type;
                placed++;
            }
        }
    }
}