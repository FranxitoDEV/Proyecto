import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { audioService } from '../services/audioService';

interface RoomSceneProps {
    onFocusComputer: () => void;
    pcOn: boolean;
    onInteract: (text: string | null) => void;
    onAction: (action: string) => void;
    settings: { sensitivity: number; brightness: number };
    isEpilogue?: boolean;
}

const RoomScene: React.FC<RoomSceneProps> = ({ onFocusComputer, pcOn, onInteract, onAction, settings, isEpilogue = false }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<PointerLockControls | null>(null);
    const moveState = useRef({ w: false, s: false, a: false, d: false });
    const isSittingRef = useRef(true); 
    const [isSitting, setIsSitting] = useState(true);
    
    const roomState = useRef({ wardrobeOpen: false, hasBattery: true });

    useEffect(() => {
        if (!mountRef.current) return;

        // 1. SETUP
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(isEpilogue ? 0x223344 : 0x050510, 0.05);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        const controls = new PointerLockControls(camera, document.body);
        controlsRef.current = controls;

        // --- ASSETS & ROOM GEOMETRY ---
        const wallMat = new THREE.MeshStandardMaterial({ color: isEpilogue ? 0x778899 : 0x505050, roughness: 0.9 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });
        const glassMat = new THREE.MeshPhysicalMaterial({ 
            color: 0x88ccff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.3 
        });

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 6;
        scene.add(ceiling);

        // Walls
        const createWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            wall.position.set(x, y, z);
            scene.add(wall);
            return wall;
        };

        createWall(20, 6, 1, 0, 3, -10); // Back
        createWall(20, 6, 1, 0, 3, 10);  // Front
        createWall(1, 6, 20, -10, 3, 0); // Left
        createWall(1, 6, 20, 10, 3, 0);  // Right

        // --- FURNITURE & OBJECTS ---
        const interactables: THREE.Object3D[] = [];
        const colliders: THREE.Box3[] = [];

        const addCollider = (x: number, z: number, w: number, d: number) => {
            const box = new THREE.Box3();
            box.setFromCenterAndSize(new THREE.Vector3(x, 1, z), new THREE.Vector3(w, 5, d));
            colliders.push(box);
        };

        // Desk
        const desk = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), woodMat);
        desk.position.set(0, 1.2, -8.5);
        scene.add(desk);
        addCollider(0, -9, 6, 2);

        // PC Monitor
        const monitorGeo = new THREE.BoxGeometry(2.0, 1.4, 0.1);
        const monitorMat = new THREE.MeshBasicMaterial({ color: isEpilogue ? 0x000000 : 0x111111 });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.set(0, 2.2, -8.5);
        monitor.name = "COMPUTER";
        monitor.userData = { msg: isEpilogue ? "SYSTEM PURGED." : "Use Computer [E]" };
        scene.add(monitor);
        interactables.push(monitor);

        if (!isEpilogue) {
            // Pills
            const pills = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            pills.rotation.z = Math.PI/2;
            pills.position.set(2, 1.3, -8.5);
            pills.name = "PILLS";
            pills.userData = { msg: "Take Xanax (Restore Sanity) [E]" };
            scene.add(pills);
            interactables.push(pills);
        }

        // Bed
        const bedGroup = new THREE.Group();
        const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 7), new THREE.MeshStandardMaterial({color: 0x1a1005}));
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 6.8), new THREE.MeshStandardMaterial({color: 0xcccccc}));
        mattress.position.y = 0.6;
        bedGroup.add(bedFrame);
        bedGroup.add(mattress);
        bedGroup.position.set(-7, 0.4, 0);
        bedGroup.name = "BED";
        bedGroup.userData = { msg: "Sleep (Pass Time / Restore Stamina) [E]" };
        scene.add(bedGroup);
        interactables.push(bedGroup);
        addCollider(-7, 0, 4, 7);

        // Wardrobe
        const wardrobe = new THREE.Group();
        const wBody = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 2), woodMat);
        const wDoor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.8, 0.1), new THREE.MeshStandardMaterial({color: 0x4d3b2f}));
        wDoor.position.set(0, 0, 1.05);
        wardrobe.add(wBody);
        wardrobe.add(wDoor);
        wardrobe.position.set(7.5, 2.5, 7.5);
        wardrobe.rotation.y = -0.5;
        wardrobe.name = "WARDROBE";
        wardrobe.userData = { msg: "Open Wardrobe [E]", doorMesh: wDoor };
        scene.add(wardrobe);
        interactables.push(wardrobe);
        addCollider(7.5, 7.5, 3, 2);

        // Window & Light (Epilogue Change)
        const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 4), new THREE.MeshStandardMaterial({color: 0xffffff}));
        windowFrame.position.set(9.9, 3, -3);
        scene.add(windowFrame);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 2.8, 3.8), glassMat);
        glass.rotation.y = -Math.PI/2;
        glass.position.set(9.85, 3, -3);
        scene.add(glass);

        // Door (Epilogue Change)
        const door = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.2), new THREE.MeshStandardMaterial({color: 0x221111}));
        if (isEpilogue) {
             door.rotation.y = -1.5; // Open
             door.position.set(-1.5, 2.5, 8.5);
        } else {
             door.position.set(0, 2.5, 9.9);
        }
        door.name = "DOOR";
        door.userData = { msg: isEpilogue ? "LEAVE ROOM [E]" : "LOCKED. They are waiting outside." };
        scene.add(door);
        interactables.push(door);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(isEpilogue ? 0x405060 : 0x404050, isEpilogue ? 0.9 : 0.6 * settings.brightness);
        scene.add(ambientLight);

        if (isEpilogue) {
            // Dawn Light
            const sunLight = new THREE.DirectionalLight(0xaaccff, 2);
            sunLight.position.set(20, 5, -5);
            sunLight.lookAt(0,0,0);
            scene.add(sunLight);
        } else {
            // Night Light
            const moonLight = new THREE.RectAreaLight(0x88ccff, 2 * settings.brightness, 4, 3);
            moonLight.position.set(9.5, 3, -3);
            moonLight.lookAt(0, 0, 0);
            scene.add(moonLight);
            
            const lampLight = new THREE.PointLight(0xffaa55, 0.8 * settings.brightness, 8);
            lampLight.position.set(-8, 3, -3);
            scene.add(lampLight);
        }

        const screenLight = new THREE.PointLight(0x00ffff, 0, 10);
        screenLight.position.set(0, 2, -7);
        scene.add(screenLight);

        // --- COLLISION LOGIC ---
        const checkCollision = (nextPos: THREE.Vector3) => {
            if (nextPos.x > 9 || nextPos.x < -9 || nextPos.z > 9 || nextPos.z < -9) return true;
            for (const box of colliders) {
                if (box.containsPoint(nextPos)) return true;
            }
            return false;
        };

        // --- ANIMATION LOOP ---
        camera.position.set(0, 1.5, -6.0);
        camera.lookAt(0, 2.0, -8.5);
        if (isEpilogue) {
             setIsSitting(false);
             isSittingRef.current = false;
             camera.position.set(0, 1.7, -4.0);
             camera.rotation.y = Math.PI; // Face door
        }

        const raycaster = new THREE.Raycaster();
        const clock = new THREE.Clock();
        let frameId = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const t = clock.elapsedTime;

            if (pcOn) {
                (monitor.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
                screenLight.intensity = (1 + Math.sin(t * 15) * 0.1) * settings.brightness;
            } else {
                (monitor.material as THREE.MeshBasicMaterial).color.setHex(0x111111);
                screenLight.intensity = 0;
            }

            // Raycasting
            if (controls.isLocked) {
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(interactables, true);
                
                if (intersects.length > 0 && intersects[0].distance < 4) {
                    let obj = intersects[0].object;
                    while(!obj.userData.msg && obj.parent) {
                        obj = obj.parent;
                    }
                    onInteract(obj.userData.msg || null);
                } else {
                    onInteract(null);
                }

                if (!isSittingRef.current) {
                    const speed = 4.0 * delta;
                    const keys = moveState.current;
                    const direction = new THREE.Vector3();
                    const forward = new THREE.Vector3();
                    const right = new THREE.Vector3();

                    camera.getWorldDirection(forward);
                    forward.y = 0; forward.normalize();
                    right.crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

                    if (keys.w) direction.add(forward);
                    if (keys.s) direction.sub(forward);
                    if (keys.d) direction.add(right);
                    if (keys.a) direction.sub(right);

                    if (direction.lengthSq() > 0) {
                        direction.normalize().multiplyScalar(speed);
                        const nextPos = camera.position.clone().add(direction);
                        
                        if (!checkCollision(nextPos)) {
                             camera.position.add(direction);
                        } else {
                            const nextX = camera.position.clone().add(new THREE.Vector3(direction.x, 0, 0));
                            if(!checkCollision(nextX)) camera.position.add(new THREE.Vector3(direction.x, 0, 0));
                            else {
                                const nextZ = camera.position.clone().add(new THREE.Vector3(0, 0, direction.z));
                                if(!checkCollision(nextZ)) camera.position.add(new THREE.Vector3(0, 0, direction.z));
                            }
                        }
                    }
                }
            }
            
            renderer.render(scene, camera);
        };
        animate();

        // --- EVENTS ---
        const onKeyDown = (e: KeyboardEvent) => {
            switch(e.key.toLowerCase()) {
                case 'w': moveState.current.w = true; break;
                case 's': moveState.current.s = true; break;
                case 'a': moveState.current.a = true; break;
                case 'd': moveState.current.d = true; break;
                case 'e': 
                    if(controls.isLocked) {
                        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                        const intersects = raycaster.intersectObjects(interactables, true);
                        if(intersects.length > 0 && intersects[0].distance < 4) {
                            let obj = intersects[0].object;
                            while(!obj.userData.msg && obj.parent) obj = obj.parent;
                            
                            if(obj.name === "COMPUTER" && !isEpilogue) {
                                setIsSitting(true);
                                isSittingRef.current = true;
                                controls.unlock();
                                camera.position.set(0, 1.5, -6.0);
                                camera.lookAt(0, 2.0, -8.5);
                                onFocusComputer();
                            }
                            else if(obj.name === "DOOR" && isEpilogue) {
                                onAction('LEAVE_ROOM');
                            }
                            // ... other interactions
                        }
                    }
                    break;
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            switch(e.key.toLowerCase()) {
                case 'w': moveState.current.w = false; break;
                case 's': moveState.current.s = false; break;
                case 'a': moveState.current.a = false; break;
                case 'd': moveState.current.d = false; break;
            }
        };

        const onRoomClick = () => {
            if(!pcOn && isSittingRef.current && !isEpilogue) {
                raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
                const intersects = raycaster.intersectObject(monitor);
                if(intersects.length > 0) {
                     onFocusComputer();
                     return;
                }
            }
            if (isSittingRef.current) {
                isSittingRef.current = false;
                setIsSitting(false);
                camera.position.set(0, 1.7, -5.0);
            }
            controls.lock();
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        const el = mountRef.current;
        if(el) el.addEventListener('mousedown', onRoomClick);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            if(el) el.removeEventListener('mousedown', onRoomClick);
            if(mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
            controls.dispose();
        };
    }, [pcOn, settings, isEpilogue]);

    return (
        <div ref={mountRef} className="absolute inset-0 cursor-pointer">
            {isSitting && !isEpilogue && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white font-mono text-center bg-black/50 p-4 border border-gray-500 rounded animate-pulse">
                    <p className="text-xl">CLICK TO STAND UP & EXPLORE</p>
                    {pcOn ? <p className="text-sm text-green-400">Computer is Active - Click Screen to Use</p> : <p className="text-sm text-gray-400">Computer is Off</p>}
                </div>
            )}
            {isEpilogue && (
                 <div className="absolute top-10 left-1/2 -translate-x-1/2 text-white font-mono text-center bg-black/50 p-4 border border-blue-500 rounded">
                    <p className="text-xl tracking-widest">OBJECTIVE: LEAVE</p>
                </div>
            )}
        </div>
    );
};

export default RoomScene;