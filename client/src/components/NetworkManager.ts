import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { io, Socket } from "socket.io-client";
import { IComponent } from "../interfaces/IComponent";
import { CharacterComponent } from "./CharacterComponent";

interface PlayerData {
    id: string;
    characterId: string;
    position: { x: number; y: number; z: number };
    rotation: { y: number };
    animation: string;
}

export class NetworkManager implements IComponent {
    private socket: Socket;
    private scene: Scene;
    private localPlayer: CharacterComponent;
    private remotePlayers: Map<string, CharacterComponent> = new Map();
    private lastUpdateTime: number = 0;
    private updateInterval: number = 16;
    private interpolationFactor: number = 0.3;
    private playerTargets: Map<string, { position: Vector3; rotationY: number }> = new Map();
    private SERVER_URL: string = import.meta.env.VITE_SERVER_URL;
    private characterId : string;

    constructor(scene: Scene, localPlayer: CharacterComponent) {
        this.scene = scene;
        this.localPlayer = localPlayer;
        this.characterId = localPlayer.getInstanceId();
        this.socket = io(this.SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            timeout: 20000,
        });

        this.socket.on("connect_error", (err) => {
            console.log("Error details", err.message);
        });
        this.setupSocketEvents();
    }

    initialize(): void {
        console.log("NetworkManager initialized");
    }

    private setupSocketEvents(): void {
        console.log("Setting up socket events...");
        // Handle Connection Events
        this.socket.on("connect", () => {
            console.log("Connected to server with ID:", this.socket.id);
            this.remotePlayers.forEach((player) => {
                player.dispose();
            });
            this.remotePlayers.clear();
        });

        // Handle Current Players
        this.socket.on("currentPlayers", (players: Record<string, PlayerData>) => {
            console.log("Received current players:", Object.keys(players));
            console.log("My character ID:", this.characterId);
            Object.values(players).forEach(playerData => {
                if (playerData.characterId && playerData.characterId !== this.characterId) {
                    if (!this.remotePlayers.has(playerData.id))
                        this.createRemotePlayer(playerData);
                }
            });
        });

        // Handle New Player
        this.socket.on("newPlayer", (playerData: PlayerData) => {
            console.log("New player joined:", playerData.id);
            if (playerData.characterId && playerData.characterId !== this.characterId
                && !this.remotePlayers.has(playerData.id)) {
                this.createRemotePlayer(playerData);
            }
        });

        // Handle Player Moved
        this.socket.on("playerMoved", (playerData: PlayerData) => {
            if(playerData.characterId === this.characterId){
                return;
            }
            const player = this.remotePlayers.get(playerData.id);
            if (player) {
                this.playerTargets.set(playerData.id, {
                    position: new Vector3(
                        playerData.position.x,
                        playerData.position.y,
                        playerData.position.z
                    ),
                    rotationY: playerData.rotation.y
                });

                if (playerData.animation) {
                    const animations = player.getAnimations();
                    const animation = animations.find(anim => anim.name === playerData.animation);
                    if (animation) {
                        const currentAnim = player.getCurrentAnimation();
                        if (currentAnim && currentAnim !== animation) {
                            currentAnim.stop();
                        }
                        if (!animation.isPlaying) {
                            animation.play(true);
                        }
                    }
                    else {
                        console.warn(`No animation data for player ${playerData.id}`);
                    }
                }
                else{
                    //Fallback to idle
                    const idleAnim = player.getAnimations().find(anim => anim.name === "Idle");
                    if (idleAnim && !idleAnim.isPlaying) {
                        idleAnim.play(true);
                    }
                }
            }
        });

        // Handle Remove Player
        this.socket.on("removePlayer", (playerId: string) => {
            console.log("Player disconnected:", playerId);

            const player = this.remotePlayers.get(playerId);
            if (player) {
                player.dispose();
                this.remotePlayers.delete(playerId);
                console.log("Removed player:", playerId);
            }
        });
    }

    private syncRemotePlayerAnimationOnStart(playerId:string,animationName:string = "Idle"):void {
        const player = this.remotePlayers.get(playerId);
        if(player){
            const animations = player.getAnimations();
            const animation = animations.find(anim => anim.name === animationName);
            if(animation){
                const currentAnim = player.getCurrentAnimation();
                if(currentAnim && currentAnim !== animation){
                    currentAnim.stop();
                }
                animation.play(true);
            }
            else{
                console.warn(`No animation data for player ${playerId} on start`);
            }
        }
    }
    private async createRemotePlayer(playerData: PlayerData): Promise<void> {
        console.log("Creating remote player:", playerData.id);
        if (this.remotePlayers.has(playerData.id)) {
            return;
        }

        const remotePlayer = new CharacterComponent(this.scene,true);
        await remotePlayer.initialize();

        const characterRoot = remotePlayer.getCharacterRoot();
        if (characterRoot) {
            characterRoot.position = new Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
            characterRoot.rotation.y = playerData.rotation.y;
        }

        const playerColor = Color3.Random();
        characterRoot.getChildMeshes().forEach(mesh => {
            if (mesh.material) {
                const newMat = mesh.material.clone(`Playermat-${playerData.id}`);
                if (newMat instanceof StandardMaterial) {
                    newMat.diffuseColor = playerColor;
                }
                mesh.material = newMat;
            }
        });

        this.remotePlayers.set(playerData.id, remotePlayer);
        this.syncRemotePlayerAnimationOnStart(playerData.id, playerData.animation);

    }

    update(): void {
        if(document.hidden || !this.localPlayer.getIsTabActive()) return;

        // Updates at specified interval
        const now = Date.now();
        if (now - this.lastUpdateTime > this.updateInterval) {
            this.lastUpdateTime = now;

            if (this.localPlayer.getCharacterRoot()) {
                const position = this.localPlayer.getCharacterRoot().position;
                const rotation = this.localPlayer.getCharacterRoot().rotation;
                const animation = this.localPlayer.getCurrentAnimation()?.name || "";

                // Emit local player daata
                this.socket.emit("playerUpdate", {
                    characterId: this.characterId,
                    position: { x: position.x, y: position.y, z: position.z },
                    rotation: { y: rotation.y },
                    animation: animation
                });
            }
        }
        this.remotePlayers.forEach((player: CharacterComponent, playerId: string) => {
            const target = this.playerTargets.get(playerId);
            const root = player.getCharacterRoot();
            if (target && root) {
                root.position = Vector3.Lerp(
                    root.position,
                    target.position,
                    this.interpolationFactor
                );
                const deltaRotation = target.rotationY - root.rotation.y;
                root.rotation.y += deltaRotation * this.interpolationFactor;
            }

        })

    }

    dispose(): void {
        this.remotePlayers.forEach((player, id) => {
            player.dispose();
            this.remotePlayers.delete(id);
        });
        this.remotePlayers.clear();
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}