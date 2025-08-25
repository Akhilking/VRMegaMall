import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { io, Socket } from "socket.io-client";
import { IComponent } from "./IComponent";
import { CharacterComponent } from "./CharacterComponent";

interface PlayerData {
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { y: number };
    animation: string;
}

export class NetworkManager implements IComponent {
    private socket: Socket;
    private scene: Scene;
    private localPlayer: CharacterComponent;
    private remotePlayers: Map<string, any> = new Map();
    private lastUpdateTime: number = 0;
    private updateInterval: number = 33;
    private interpolationFactor: number = 0.15;
     private playerTargets: Map<string, { position: Vector3; rotationY: number }> = new Map();

    constructor(scene: Scene, localPlayer: CharacterComponent) {
        this.scene = scene;
        this.localPlayer = localPlayer
        this.socket = io("http://localhost:3000", {
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
            Object.values(players).forEach(playerData => {
                if (playerData.id !== this.socket.id) {
                    if(!this.remotePlayers.has(playerData.id))
                    this.createRemotePlayer(playerData);
                }
            });
        });

        // Hanlde New Player
        this.socket.on("newPlayer", (playerData: PlayerData) => {
            console.log("New player joined:", playerData.id);
            if (playerData.id !== this.socket.id && !this.remotePlayers.has(playerData.id)) {
                this.createRemotePlayer(playerData);
            }
        });

        // Handle Player Moved
        this.socket.on("playerMoved", (playerData: PlayerData) => {
            const player = this.remotePlayers.get(playerData.id);
            if (player) {
                // player.targetPosition = new Vector3(
                //     playerData.position.x,
                //     playerData.position.y,
                //     playerData.position.z
                // );
                // player.targetRotation = playerData.rotation.y;
                this.playerTargets.set(playerData.id,{
                    position:new Vector3(
                        playerData.position.x,
                        playerData.position.y,
                        playerData.position.z
                    ),
                    rotationY:playerData.rotation.y
                });

                if (player.setAnimation && playerData.animation) {
                    player.setAnimation(playerData.animation);
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

    private createRemotePlayer(playerData: PlayerData): void {
        console.log("Creating remote player:", playerData.id);
        if(this.remotePlayers.has(playerData.id)){
            return;
        }
        const playerMesh = this.localPlayer.getCharacterRoot()?.clone(`remotePlayer-${playerData.id}`,null);
        const playerColor = Color3.Random();

        playerMesh.getChildMeshes().forEach(mesh => {
            if (mesh.material){
                const newMat = mesh.material.clone(`playermat-${playerData.id}`);
                if (newMat instanceof StandardMaterial) {
                    newMat.diffuseColor = playerColor;
                }
                mesh.material = newMat;
            }
        })

        playerMesh.position = new Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );

        this.playerTargets.set(playerData.id, {
            position: new Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            ),
            rotationY: playerData.rotation.y
         });

        this.remotePlayers.set(playerData.id, playerMesh);

    }

    update(): void {

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
                    position: { x: position.x, y: position.y, z: position.z },
                    rotation: { y: rotation.y },
                    animation: animation
                });
            }
        }
        this.remotePlayers.forEach((player: any,playerId: string) => {
            const target = this.playerTargets.get(playerId);
            if (target) {
                player.position = Vector3.Lerp(
                    player.position,
                    target.position,
                    this.interpolationFactor
                );
                if(player.rotation){
                    const deltaRotation = target.rotationY - player.rotation.y;
                    player.rotation.y += deltaRotation * this.interpolationFactor;
                }
            }
            // if(player.targetPosition){
            //     player.position = Vector3.Lerp(
            //         player.position,
            //         player.targetPosition,
            //         this.interpolationFactor
            //     );
            //     if(player.rotation && player.targetRotation !== undefined){
            //         const deltaRotation = player.targetRotation - player.rotation.y;
            //         player.rotation.y += deltaRotation * this.interpolationFactor;
            //     }
            // }
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