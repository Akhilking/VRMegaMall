import { Scene, Vector3, AssetContainer, TransformNode, AnimationGroup, Matrix, FollowCamera, UniversalCamera } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";

export class CharacterComponent implements IComponent {
    private scene: Scene;
    private characterMesh: any;
    private assetContainer: AssetContainer | null = null;
    private animations: AnimationGroup[] = [];
    private currentAnimation: AnimationGroup | null = null;
    private fpsCamera: UniversalCamera | null = null;
    private headNode: TransformNode | null = null;
    private cameraHeight: number = 27;
    private isDragging: boolean = false;
    private isTabActive: boolean = true;
    private moveSpeed: number = 0.1;
    private rotationAmount: number = 0.03;
    private inputMap: { [key: string]: boolean } = {};
    private moveDirection: Vector3 = new Vector3(0, 0, 0);
    private characterRoot: TransformNode | null = null;
    private danceModeActive: boolean = false;
    private instanceId: string;
    private isRemotePlayer: boolean = false;

    constructor(scene: Scene, isRemote: boolean = false) {
        this.scene = scene;
        this.isRemotePlayer = isRemote;
        this.instanceId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        if (!this.isRemotePlayer) {
            document.addEventListener("visibilitychange", () => {
                this.isTabActive = !document.hidden;
                if (!this.isTabActive) {
                    Object.keys(this.inputMap).forEach(key => {
                        this.inputMap[key] = false;
                    });
                    this.moveDirection.setAll(0);
                    this.isDragging = false;
                }
            });
        }
    }

    async initialize(): Promise<void> {
        try {
            this.assetContainer = await LoadAssetContainerAsync(
                "https://assets.babylonjs.com/meshes/HVGirl.glb",
                this.scene,
            )

            const result = this.assetContainer.addAllToScene();
            this.characterRoot = new TransformNode("characterRoot", this.scene);
            this.characterMesh = this.assetContainer.meshes[0];

            // Log all available animations
            if (this.assetContainer.animationGroups && this.assetContainer.animationGroups.length > 0) {
                this.animations = this.assetContainer.animationGroups;

                this.playAnimation("Idle");
            } else {
                console.log("No animations found in the model");
            }


            if (this.characterMesh) {
                this.characterMesh.parent = this.characterRoot;
                this.characterRoot.position = new Vector3(0, 0, 0);
                this.characterRoot.scaling.setAll(0.1);

                this.headNode = new TransformNode("headNode", this.scene);
                this.headNode.parent = this.characterRoot;
                this.headNode.position = new Vector3(0, this.cameraHeight, -20);
            }

            this.setupFPSCamera();
            this.setupInputHandling();

            console.log("Character model loaded successfully");
        }
        catch (error) {
            console.error("Error loading character model:", error);
        }
    }


    private setupFPSCamera(): void {
        if (!this.headNode || this.isRemotePlayer) return;

        this.fpsCamera = new UniversalCamera("FPSCamera", Vector3.Zero(), this.scene);
        this.fpsCamera.parent = this.headNode;

        this.fpsCamera.fov = 1.2;
        this.fpsCamera.minZ = 0.1;

        this.fpsCamera.applyGravity = false;
        this.fpsCamera.checkCollisions = false;

        this.scene.activeCamera = this.fpsCamera;
        this.fpsCamera.inputs.clear();
        const canvas = this.scene.getEngine().getRenderingCanvas();

        this.fpsCamera.attachControl(canvas, true)

        this.scene.onPointerDown = () => {
            if (this.characterRoot && this.isTabActive && !this.isRemotePlayer) {
                this.isDragging = true;
            }
        };
        this.scene.onPointerUp = () => {
            if (this.characterRoot && this.isTabActive && !this.isRemotePlayer) {
                this.isDragging = false;
            }
        };

        this.scene.onPointerMove = (evt) => {
            if (this.characterRoot && this.isDragging && this.isTabActive && !this.isRemotePlayer) {
                this.characterRoot.rotation.y -= evt.movementX * 0.002;
                this.characterRoot.rotation.x -= evt.movementY * 0.002;
            }
        }
    }

    private setupInputHandling(): void {
        if (this.isRemotePlayer) return;

        window.addEventListener("keydown", (event) => {
            if (this.isTabActive) {
                this.inputMap[event.key.toLowerCase()] = true;

                if (event.key.toLowerCase() === 'r') {
                    this.danceModeActive = !this.danceModeActive;
                    if (this.danceModeActive) {
                        this.playAnimation("Samba");
                    }
                }
            }
        });

        window.addEventListener("keyup", (event) => {
            if (this.isTabActive) {
                this.inputMap[event.key.toLowerCase()] = false;
            }
        });
    }

    private playAnimation(name: string): void {
        const animation = this.animations.find(anim => anim.name === name);
        if (!animation) {
            console.warn(`Animation "${name}" not found`);
            return;
        }
        if (this.currentAnimation === animation && animation.isPlaying) {
            return;
        }
        if (this.currentAnimation && this.currentAnimation.isPlaying) {
            this.currentAnimation.stop();
        }
        animation.play(true);
        this.currentAnimation = animation;

    }
    update(): void {
        if (!this.characterRoot || !this.fpsCamera || !this.isTabActive || this.isRemotePlayer || this.danceModeActive) return;

        this.moveDirection.setAll(0);

        const forward = this.fpsCamera.getDirection(Vector3.Forward());
        forward.y = 0;
        forward.normalize();

        const right = Vector3.Cross(forward, Vector3.Up()).normalize();

        if (this.inputMap["w"] || this.inputMap["arrowup"]) {
            this.moveDirection.addInPlace(forward);
        }
        if (this.inputMap["s"] || this.inputMap["arrowdown"]) {
            this.moveDirection.addInPlace(forward.scale(-1));
        }
        if (this.inputMap["a"] || this.inputMap["arrowleft"]) {
            this.moveDirection.addInPlace(right);
        }
        if (this.inputMap["d"] || this.inputMap["arrowright"]) {
            this.moveDirection.addInPlace(right.scale(-1));
        }

        if (this.inputMap["q"]) {
            this.characterRoot.rotation.y -= this.rotationAmount;
        }
        if (this.inputMap["e"]) {
            this.characterRoot.rotation.y += this.rotationAmount;
        }

        this.updateAnimation();


        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();
            this.characterRoot.position.addInPlace(
                this.moveDirection.scale(this.moveSpeed)
            );
        }
    }

    private updateAnimation(): void {
        if (this.danceModeActive) {
            return;
        }
        if (this.moveDirection.length() === 0) {
            this.playAnimation("Idle");
        } else {
            this.playAnimation("Walking");
        }
    }

    dispose(): void {
        if (this.assetContainer) {
            this.assetContainer.removeAllFromScene();
            this.assetContainer.dispose();
            this.characterMesh = null;
        }
        if (this.fpsCamera) {
            this.fpsCamera.dispose();
        }
    }

    getCamera(): UniversalCamera | null {
        return this.fpsCamera;
    }

    getCharacterRoot(): TransformNode | null {
        return this.characterRoot;
    }
    getCurrentAnimation(): AnimationGroup | null {
        return this.currentAnimation;
    }

    getAnimations(): AnimationGroup[] {
        return this.animations;
    }

    getInstanceId(): string {
        return this.instanceId;
    }

    getIsTabActive(): boolean {
        return this.isTabActive;
    }
}