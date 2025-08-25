import { Scene, Vector3, AssetContainer, TransformNode, AnimationGroup, Matrix, FollowCamera } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";

export class CharacterComponent implements IComponent {
    private scene: Scene;
    private characterMesh: any;
    private assetContainer: AssetContainer | null = null;
    private animations: AnimationGroup[] = [];
    private currentAnimation: AnimationGroup | null = null;
    private followCamera: FollowCamera | null = null;

    private moveSpeed: number = 0.1;
    private rotationSpeed: number = 0.05;
    private inputMap: { [key: string]: boolean } = {};
    private moveDirection: Vector3 = new Vector3(0, 0, 0);
    private characterRoot: TransformNode | null = null;
    private danceModeActive: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;
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
                this.characterMesh.position = Vector3.Zero();
                this.characterMesh.scaling = new Vector3(1, 1, 1);
            }

            this.setupFollowCamera();
            this.setupInputHandling();

            console.log("Character model loaded successfully");
        }
        catch (error) {
            console.error("Error loading character model:", error);
        }
    }

    private setupFollowCamera(): void {
        if (!this.characterRoot) return;

        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 5, -10), this.scene, this.characterMesh);

        this.followCamera.radius = 10;
        this.followCamera.lowerRadiusLimit = 5;
        this.followCamera.upperRadiusLimit = 15;

        this.followCamera.heightOffset = 1.5;
        this.followCamera.lowerHeightOffsetLimit = 0.5;
        this.followCamera.upperHeightOffsetLimit = 8;

        this.followCamera.rotationOffset = 0;
        this.followCamera.cameraAcceleration = 0.01;
        this.followCamera.maxCameraSpeed = 1;

        this.followCamera.attachControl(true);
    }

    private setupInputHandling(): void {
        window.addEventListener("keydown", (event) => {
            this.inputMap[event.key.toLowerCase()] = true;

            if (event.key.toLowerCase() === 'e') {
                this.danceModeActive = !this.danceModeActive;
                if (this.danceModeActive) {
                    this.playAnimation("Samba");
                }
            }
        });

        window.addEventListener("keyup", (event) => {
            this.inputMap[event.key.toLowerCase()] = false;
        }
        );
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
        // console.log(`Playing animation: ${name}`);

    }
    update(): void {
        // Update character logic here (e.g., play animations)
        if (!this.characterRoot) return;

        if (this.danceModeActive) {
            return;
        }

        this.moveDirection.setAll(0);

        if (this.inputMap["w"] || this.inputMap["arrowup"]) {
            this.moveDirection.z = -1;
        }
        if (this.inputMap["s"] || this.inputMap["arrowdown"]) {
            this.moveDirection.z = 1;
        }
        if (this.inputMap["a"] || this.inputMap["arrowleft"]) {
            this.moveDirection.x = 1;
        }
        if (this.inputMap["d"] || this.inputMap["arrowright"]) {
            this.moveDirection.x = -1;
        }

        this.updateAnimation();


        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();

            const shouldRotate = this.moveDirection.z !== 0;

            const worldMovement = Vector3.TransformCoordinates(
                new Vector3(this.moveDirection.x, 0, this.moveDirection.z),
                Matrix.RotationY(this.characterRoot.rotation.y)
            )

            this.characterRoot.position.addInPlace(worldMovement.scale(this.moveSpeed));

            if (shouldRotate) {
                if (this.moveDirection.z >= 0) {
                    const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);

                    //smooth rotation
                    const currentRotation = this.characterRoot.rotation.y;
                    const rotationDiff = targetRotation - currentRotation;

                    let deltaRotation = rotationDiff;
                    if (rotationDiff > Math.PI) {
                        deltaRotation -= 2 * Math.PI;
                    }
                    if (rotationDiff < -Math.PI) {
                        deltaRotation += 2 * Math.PI;
                    }

                    this.characterRoot.rotation.y += deltaRotation * this.rotationSpeed;
                }
                else {
                    const targetRotation = Math.atan2(-this.moveDirection.x, -this.moveDirection.z);

                    //smooth rotation
                    const currentRotation = this.characterRoot.rotation.y;
                    const rotationDiff = targetRotation - currentRotation;

                    let deltaRotation = rotationDiff;
                    if (rotationDiff > Math.PI) {
                        deltaRotation -= 2 * Math.PI;
                    }
                    if (rotationDiff < -Math.PI) {
                        deltaRotation += 2 * Math.PI;
                    }

                    this.characterRoot.rotation.y += deltaRotation * this.rotationSpeed;
                }
            }
        }
    }

    private updateAnimation(): void {
        if (this.danceModeActive) {
            return;
        }
        if (this.moveDirection.length() === 0) {
            this.playAnimation("Idle");
        } else if (this.moveDirection.z < 0) {
            this.playAnimation("Walking");
        } else if (this.moveDirection.z > 0) {
            this.playAnimation("WalkingBack");
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
        if (this.followCamera) {
            this.followCamera.dispose();
        }
    }

    getCamera(): FollowCamera | null {
        return this.followCamera;
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
}