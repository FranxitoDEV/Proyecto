import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GameState, TileType } from '../types';
import { audioService } from '../services/audioService';

interface GameSceneProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onStatsChange: (stats: any) => void;
  onMessage: (msg: string) => void;
  onPlayerMove: (pos: { x: number; z: number; rot: number }) => void;
  onInteractUpdate: (label: string | null) => void;
  onNoteRead: (content: string) => void;
  mazeGrid: number[][];
  stats: any;
}

const UNIT_SIZE = 4;
const COLLISION_RADIUS = 1.0; 
const ENEMY_SPEED = 3.5; // Slightly slower than player run, faster than walk

const GameScene: React.FC<GameSceneProps> = ({ 
  gameState, setGameState, onStatsChange, onMessage,
  onPlayerMove, onInteractUpdate, onNoteRead, mazeGrid, stats
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  
  const statsRef = useRef(stats);
  const itemsRef = useRef<{mesh: THREE.Object3D, type: number, id: string, content?: string, active: boolean}[]>([]);
  const enemyRef = useRef<{mesh: THREE.Mesh, active: boolean, pos: THREE.Vector3}>({
      mesh: new THREE.Mesh(), active: false, pos: new THREE.Vector3(0,0,0)
  });

  const controlsRef = useRef<PointerLockControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveState = useRef({ w: false, s: false, a: false, d: false, shift: false, space: false });
  
  // Blindness State
  const [eyesClosed, setEyesClosed] = useState(false);
  const eyesClosedRef = useRef(false);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); 
    scene.fog = new THREE.FogExp2(0x050505, 0.15); // High fog for atmosphere

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;

    const onLock = () => setPaused(false);
    const onUnlock = () => setPaused(true);
    
    controls.addEventListener('lock', onLock);
    controls.addEventListener('unlock', onUnlock);

    // --- TEXTURES ---
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0,0,64,64);
        ctx.strokeStyle = '#3a3a3a'; ctx.strokeRect(0,0,64,64);
    }
    const wallTex = new THREE.CanvasTexture(canvas);
    wallTex.magFilter = THREE.NearestFilter;
    
    const wallGeo = new THREE.BoxGeometry(UNIT_SIZE, UNIT_SIZE * 4, UNIT_SIZE);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
    const floorGeo = new THREE.PlaneGeometry(UNIT_SIZE, UNIT_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    itemsRef.current = [];

    // --- BUILD MAZE ---
    let startPos = new THREE.Vector3(0, 0, 0);
    let enemySpawnPos = new THREE.Vector3(0, 0, 0);

    mazeGrid.forEach((row, z) => {
        row.forEach((cell, x) => {
            const px = x * UNIT_SIZE;
            const pz = z * UNIT_SIZE;
            
            // Floor & Ceiling
            const f = new THREE.Mesh(floorGeo, floorMat);
            f.rotation.x = -Math.PI/2;
            f.position.set(px, 0, pz);
            scene.add(f);

            const c = new THREE.Mesh(floorGeo, ceilingMat);
            c.rotation.x = Math.PI/2;
            c.position.set(px, UNIT_SIZE * 3, pz);
            scene.add(c);

            if (cell === TileType.WALL) {
                const w = new THREE.Mesh(wallGeo, wallMat);
                w.position.set(px, UNIT_SIZE * 2, pz); 
                scene.add(w);
            } else if (cell === TileType.START) {
                startPos.set(px, 1.7, pz);
            } else if (cell === TileType.ENEMY_SPAWN) {
                enemySpawnPos.set(px, 1.5, pz);
            }

            // Items (Generators, Keys)
            if ([TileType.KEY, TileType.GENERATOR, TileType.NOTE].includes(cell)) {
                const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(px, 1.5, pz);
                scene.add(mesh);

                let content = "";
                if(cell === TileType.NOTE) content = "SURVIVAL RULE #1: If you hear it, CLOSE YOUR EYES. It tracks sight, not sound.";

                itemsRef.current.push({
                    mesh, type: cell, id: `${x}_${z}`, active: true, content
                });
            }
        });
    });

    camera.position.copy(startPos);

    // --- ENEMY SETUP ---
    // Simple Red Cube representation for MVP
    const enemyGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
    const enemyMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
    enemyMesh.position.copy(enemySpawnPos);
    scene.add(enemyMesh);
    enemyRef.current = { mesh: enemyMesh, active: true, pos: enemySpawnPos };

    // --- LIGHTING ---
    // Ambient light is enough now, no flashlight
    const ambientLight = new THREE.AmbientLight(0x444455, 0.5); 
    scene.add(ambientLight);
    
    // Player Point Light (Weak aura)
    const auraLight = new THREE.PointLight(0xffffff, 0.5, 10);
    camera.add(auraLight);
    scene.add(camera);

    // --- COLLISION LOGIC ---
    const checkCollision = (x: number, z: number) => {
        const gridX = Math.round(x / UNIT_SIZE);
        const gridZ = Math.round(z / UNIT_SIZE);
        if (gridZ < 0 || gridZ >= mazeGrid.length || gridX < 0 || gridX >= mazeGrid[0].length) return true;
        if (mazeGrid[gridZ][gridX] === TileType.WALL) {
            const wallX = gridX * UNIT_SIZE;
            const wallZ = gridZ * UNIT_SIZE;
            const dx = x - wallX;
            const dz = z - wallZ;
            const halfSize = UNIT_SIZE / 2;
            const minDist = halfSize + COLLISION_RADIUS * 0.4;
            if (Math.abs(dx) < minDist && Math.abs(dz) < minDist) return true;
        }
        return false;
    };

    // --- GAME LOOP ---
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    let frameId = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.1);
        const t = clock.elapsedTime;
        
        // --- BLINDNESS MECHANIC ---
        const closed = moveState.current.space;
        if (closed !== eyesClosedRef.current) {
            eyesClosedRef.current = closed;
            setEyesClosed(closed);
        }

        // Render scene only if eyes open (or render black)
        // We handle black overlay in UI, so just render scene here
        renderer.render(scene, camera);

        if (!controls.isLocked) return;

        const playerPos = camera.position;

        // --- ENEMY AI ---
        const enemy = enemyRef.current;
        if (enemy.active) {
            const dist = enemy.mesh.position.distanceTo(playerPos);
            
            // Audio Cue based on distance
            if(dist < 20) {
                 // Calculate volume based on dist
                 const vol = Math.max(0, (20 - dist) / 20);
                 // We would update audio service here with volume
            }

            // CHASE LOGIC
            // If eyes are OPEN, enemy chases player.
            // If eyes are CLOSED, enemy stops tracking (or wanders slowly).
            if (!eyesClosedRef.current) {
                // Look at player
                enemy.mesh.lookAt(playerPos.x, enemy.mesh.position.y, playerPos.z);
                const dir = new THREE.Vector3().subVectors(playerPos, enemy.mesh.position).normalize();
                
                // Move towards player
                const moveDist = ENEMY_SPEED * dt;
                const nextPos = enemy.mesh.position.clone().add(dir.multiplyScalar(moveDist));
                
                // Simple wall collision for enemy
                if (!checkCollision(nextPos.x, nextPos.z)) {
                    enemy.mesh.position.copy(nextPos);
                }

                // KILL CONDITION
                if (dist < 1.5) {
                    onMessage("CAUGHT");
                    audioService.playGlitch();
                    setGameState(GameState.GAME_OVER);
                }

                // Sanity Drain from proximity while looking
                if (dist < 10) {
                    onStatsChange({ sanity: Math.max(0, statsRef.current.sanity - (dt * 5)) });
                }
            } else {
                // Eyes Closed: Enemy is confused/idle.
                // It stays still or moves randomly (for now, stays still to reward player)
                // Sanity Drain from "Fear of Dark"
                onStatsChange({ sanity: Math.max(0, statsRef.current.sanity - (dt * 2)) });
            }
        }

        // --- PLAYER MOVEMENT ---
        const keys = moveState.current;
        const s = statsRef.current;

        const baseSpeed = keys.shift && s.stamina > 0 ? 9.0 : 6.0;
        const speed = s.isCrouching ? 3.0 : baseSpeed;
        
        const direction = new THREE.Vector3();
        if (keys.w) direction.z -= 1;
        if (keys.s) direction.z += 1;
        if (keys.a) direction.x -= 1;
        if (keys.d) direction.x += 1;
        
        if (direction.lengthSq() > 0) {
            direction.normalize().multiplyScalar(speed * dt);
            const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
            direction.applyEuler(euler);

            const nextX = camera.position.x + direction.x;
            if (!checkCollision(nextX, camera.position.z)) {
                camera.position.x = nextX;
            }

            const nextZ = camera.position.z + direction.z;
            if (!checkCollision(camera.position.x, nextZ)) {
                camera.position.z = nextZ;
            }
        }

        // Bobbing
        const targetHeight = s.isCrouching ? 1.0 : 1.7;
        const bob = (keys.w||keys.s||keys.a||keys.d) ? Math.sin(t * 12) * 0.05 : 0;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetHeight + bob, dt * 10);

        // Interaction
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        const intersects = raycaster.intersectObjects(itemsRef.current.map(i => i.mesh));
        
        let label = null;
        if (intersects.length > 0 && intersects[0].distance < 6.0 && !eyesClosedRef.current) {
            const hitObj = itemsRef.current.find(i => i.mesh === intersects[0].object);
            if (hitObj && hitObj.active) {
                switch(hitObj.type) {
                    case TileType.KEY: label = "PICK UP KEY [E]"; break;
                    case TileType.GENERATOR: label = "ACTIVATE GENERATOR [E]"; break;
                    case TileType.NOTE: label = "READ NOTE [E]"; break;
                }
            }
        }
        onInteractUpdate(label);
        
        onPlayerMove({
            x: camera.position.x / UNIT_SIZE,
            z: camera.position.z / UNIT_SIZE,
            rot: camera.rotation.y
        });
    };

    animate();

    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'Tab') { e.preventDefault(); controls.unlock(); return; }
        const k = e.key.toLowerCase();
        if (k === 'w') moveState.current.w = true;
        if (k === 's') moveState.current.s = true;
        if (k === 'a') moveState.current.a = true;
        if (k === 'd') moveState.current.d = true;
        if (k === 'shift') moveState.current.shift = true;
        if (k === ' ') moveState.current.space = true; // CLOSE EYES
        
        if (k === 'e') {
            // Interaction logic (same as before)
            raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
            const intersects = raycaster.intersectObjects(itemsRef.current.map(i => i.mesh));
            if(intersects.length > 0 && intersects[0].distance < 6.0) {
                 const item = itemsRef.current.find(i => i.mesh === intersects[0].object);
                 if(item && item.active) {
                     if(item.type === TileType.KEY) {
                         onStatsChange({ hasKey: true });
                         audioService.playPickup();
                         onMessage("KEY ACQUIRED");
                         item.active = false;
                         item.mesh.visible = false;
                     }
                     if(item.type === TileType.NOTE) {
                         controls.unlock();
                         onNoteRead(item.content || "");
                         item.active = false;
                         item.mesh.visible = false;
                     }
                     if(item.type === TileType.GENERATOR) {
                        onStatsChange({ generatorsActive: statsRef.current.generatorsActive + 1 });
                        audioService.playGeneratorStart();
                        onMessage("POWER RESTORED");
                        (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(0x0000ff);
                        item.active = false;
                    }
                 }
            }
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (k === 'w') moveState.current.w = false;
        if (k === 's') moveState.current.s = false;
        if (k === 'a') moveState.current.a = false;
        if (k === 'd') moveState.current.d = false;
        if (k === 'shift') moveState.current.shift = false;
        if (k === ' ') moveState.current.space = false; // OPEN EYES
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
        cancelAnimationFrame(frameId);
        controls.removeEventListener('lock', onLock);
        controls.removeEventListener('unlock', onUnlock);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        if(mountRef.current && renderer.domElement) {
             mountRef.current.removeChild(renderer.domElement);
        }
        // Dispose controls to remove event listeners from document
        controls.dispose();
    };
  }, [gameState]); 

  const resume = () => {
      // Prevent "The user has exited the lock..." by ensuring we don't spam lock
      if(!controlsRef.current?.isLocked) {
         // Wrap in small timeout to ensure previous lock actions or events have settled
         setTimeout(() => {
             try {
                controlsRef.current?.lock();
             } catch(e) {
                 console.error("Lock failed:", e);
             }
         }, 50);
      }
  };

  return (
    <>
        <div ref={mountRef} className="absolute inset-0" />
        {/* BLINDNESS OVERLAY */}
        {eyesClosed && (
            <div className="absolute inset-0 bg-black z-[100] flex items-center justify-center pointer-events-none">
                <div className="text-gray-900 font-bold text-4xl animate-pulse">EYES CLOSED</div>
            </div>
        )}
        
        {paused && (
             <div className="absolute inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center font-retro text-white">
                 <h1 className="text-4xl text-red-600 mb-8 tracking-widest border-b border-red-900 pb-2">PAUSED</h1>
                 <button onClick={resume} className="hover:bg-white hover:text-black p-2 border border-white transition-colors">[ RESUME ]</button>
             </div>
        )}
        {!paused && !controlsRef.current?.isLocked && (
            <div className="absolute inset-0 z-[9999] bg-black/50 flex items-center justify-center cursor-pointer" onClick={resume}>
                <div className="text-white font-mono text-xl bg-black p-4 border border-white animate-pulse">CLICK TO START</div>
            </div>
        )}
    </>
  );
};

export default GameScene;