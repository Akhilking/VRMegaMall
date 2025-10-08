import { Scene, Vector3, AssetContainer, TransformNode, ArcRotateCamera, StandardMaterial, Texture, Color3, Material, FresnelParameters, PBRMaterial, AbstractMesh, Particle, ParticleSystem, Color4, DirectionalLight, HemisphericLight, MeshBuilder, CubeTexture } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "../interfaces/IComponent";
import { ModelComponent } from "./ModelComponent";
import { ExplodedViewComponent } from "./ExplodedViewComponent";
import { Inspector } from "@babylonjs/inspector";
import { MaterialEffectService } from "./MaterialEffectService";

export class MallComponent implements IComponent {
    private scene: Scene;
    private modelComponent: ModelComponent;
    private explodedViewComponent: ExplodedViewComponent | null = null;
    private isLoaded: boolean = false;
    private defaultCamera: ArcRotateCamera;
    private materialEffectService: MaterialEffectService;
    private activeEffects: Map<string, string> = new Map();
    private originalModel: TransformNode | null = null;
    private wetModel : TransformNode | null = null;
    private hotModel : TransformNode | null = null;
    private coldModel : TransformNode | null = null;
    private isTransitioning: boolean = false;

    constructor(scene: Scene, modelComponent: ModelComponent) {
        this.scene = scene;
        this.modelComponent = modelComponent;
        this.materialEffectService = new MaterialEffectService(scene);
    }

    async initialize(): Promise<void> {
        this.createSkybox();
        try {
            const shoeModel = await this.modelComponent.loadModel(
                "shoe_display",
                "./assets/models/t_shirt.glb",
            );
            console.log("Shoe model loaded with ID:", shoeModel);
            this.originalModel = shoeModel;
            this.originalModel.position = new Vector3(0, 0.05, 0);

            const materialId = this.materialEffectService.applyCottonMaterial(this.originalModel, new Color3(1, 0, 0));
            this.setupInspector();
            this.isLoaded = true;
            console.log("Mall Models loaded Successfully")
        }
        catch (error) {
            console.error("Error initializing mall model:", error);
        }
    }

    private createSkybox(): void {
        // Create a skybox using a cube texture
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, this.scene);
        const skyboxMaterial = new StandardMaterial("skyBoxMaterial", this.scene);

        // Important: Render skybox from inside
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;

        // Use one of these preset skyboxes (choose one and uncomment)

        // skyboxMaterial.reflectionTexture = new CubeTexture(
        //     "https://assets.babylonjs.com/environments/studio.env", this.scene);

        skyboxMaterial.reflectionTexture = new CubeTexture(
            "https://assets.babylonjs.com/environments/environmentSpecular.env", this.scene);

        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skybox.material = skyboxMaterial;

        // Make skybox not pickable and excluded from reflections
        skybox.isPickable = false;
    }


    public applyCottonMaterial(color: Color3): void {
        if (!this.originalModel) return;

        this.materialEffectService.applyCottonMaterial(this.originalModel, color);
    }

    public async applyWetEffectTransition(): Promise<void> {
        if(!this.originalModel || this.isTransitioning) return;

        this.isTransitioning = true;

        try {
            await this.cleanupActiveEffects();
            await this.fadeOutModel(this.originalModel, 400);

            this.wetModel = this.cloneModel();
            this.wetModel.position = this.originalModel.position.clone();

            const materialId = this.materialEffectService.applyCottonMaterial(this.wetModel, new Color3(1, 0, 0));
            const wetEffectId = this.materialEffectService.applyWetEffect(this.wetModel, 0.9, true);

            this.originalModel.setEnabled(false);
            await this.fadeInModel(this.wetModel, 400);
        }
        catch(error){
            console.error("Error during wet effect transition:", error);
        }
        finally{
            this.isTransitioning = false;
        }
    }

    public async applyHotEffectTransition(): Promise<void> {
        if (!this.originalModel || this.isTransitioning) return;

        this.isTransitioning = true;

        try {
            console.log("Applying hot effect transition...");
            await this.cleanupActiveEffects();

            // Fade out original model
            await this.fadeOutModel(this.originalModel, 400);

            // Clone model for hot effect
            this.hotModel = this.cloneModel();
            this.hotModel.position = this.originalModel.position.clone();

            // Apply hot effects
            const materialId = this.materialEffectService.applyCottonMaterial(this.hotModel, new Color3(1, 0, 0));
            const hotEffectId = this.materialEffectService.applyHotEffect(this.hotModel, 0.8, true);

            // Hide original and show hot model
            this.originalModel.setEnabled(false);
            await this.fadeInModel(this.hotModel, 400);

            console.log("Hot effect transition completed!");
        }
        catch (error) {
            console.error("Error during hot effect transition:", error);
        }
        finally {
            this.isTransitioning = false;
        }
    }

    public async applyColdEffectTransition(): Promise<void> {
        if (!this.originalModel || this.isTransitioning) return;

        this.isTransitioning = true;

        try {
            console.log("Applying cold effect transition...");

            await this.cleanupActiveEffects();

            await this.fadeOutModel(this.originalModel, 400);

            this.coldModel = this.cloneModel();
            this.coldModel.position = this.originalModel.position.clone();

            // Apply cold effects
            const materialId = this.materialEffectService.applyCottonMaterial(this.coldModel, new Color3(1, 0, 0));
            const coldEffectId = this.materialEffectService.applyColdEffect(this.coldModel, 0.8, true);

            this.originalModel.setEnabled(false);
            await this.fadeInModel(this.coldModel, 400);

            console.log("Cold effect transition completed!");
        }
        catch (error) {
            console.error("Error during cold effect transition:", error);
        }
        finally {
            this.isTransitioning = false;
        }
    }

    public async removeAllEffect(): Promise<void> {
        if (this.isTransitioning) return;

        this.isTransitioning = true;

        try {
            // Fade out any active effect model
            const activeModel = this.wetModel || this.hotModel || this.coldModel;
            if (activeModel) {
                await this.fadeOutModel(activeModel, 400);
            }

            // Clean up all effects
            await this.cleanupActiveEffects();

            // Show original model
            this.originalModel!.setEnabled(true);
            await this.fadeInModel(this.originalModel!, 400);
        }
        catch (error) {
            console.error("Error removing effects:", error);
        }
        finally {
            this.isTransitioning = false;
        }
    }

    private fadeOutModel(model: TransformNode, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const meshes = model.getChildMeshes();
            const startTime = Date.now();

            const originalAlphas: Map<AbstractMesh, number> = new Map();
            meshes.forEach(mesh => {
                if (mesh.material) {
                    const material = mesh.material as any;
                    originalAlphas.set(mesh, material.alpha || 1);

                    // Enable transparency for smooth fading
                    if (material.diffuseTexture) {
                        material.diffuseTexture.hasAlpha = true;
                    }
                    material.useAlphaFromDiffuseTexture = true;
                    material.transparencyMode = 2; // ALPHABLEND mode
                }
            });

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Use easing function for smoother animation
                const easeProgress = 1 - Math.pow(progress, 2); // ease-out quad
                const alpha = easeProgress;

                meshes.forEach(mesh => {
                    if (mesh.material) {
                        const material = mesh.material as any;
                        const originalAlpha = originalAlphas.get(mesh) || 1;
                        material.alpha = alpha * originalAlpha;
                    }
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    private fadeInModel(model: TransformNode, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const meshes = model.getChildMeshes();
            const startTime = Date.now();

            meshes.forEach(mesh => {
                if (mesh.material) {
                    const material = mesh.material as any;

                    // Enable transparency
                    if (material.diffuseTexture) {
                        material.diffuseTexture.hasAlpha = true;
                    }
                    material.useAlphaFromDiffuseTexture = true;
                    material.transparencyMode = 2; // ALPHABLEND mode
                    material.alpha = 0; // Start fully transparent
                }
            });

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Use easing function for smoother animation
                const easeProgress = 1 - Math.pow(1 - progress, 2); // ease-in quad
                const alpha = easeProgress;

                meshes.forEach(mesh => {
                    if (mesh.material) {
                        const material = mesh.material as any;
                        material.alpha = alpha;
                    }
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure full opacity at the end
                    meshes.forEach(mesh => {
                        if (mesh.material) {
                            (mesh.material as any).alpha = 1;
                        }
                    });
                    resolve();
                }
            };


            animate();
        });
    }

    private animateModelPosition(model: TransformNode, targetPosition: Vector3, duration: number): Promise<void> {
        return new Promise((resolve) => {
            const startPosition = model.position.clone();
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const easeProgress = 1 - Math.pow(1 - progress, 3);

                model.position = Vector3.Lerp(startPosition, targetPosition, easeProgress);

                if(progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }
            animate();
        })
    }

    private cloneModel(): TransformNode {
        if (!this.originalModel) {
            throw new Error("No original model to clone");
        }

        const clonedRoot = new TransformNode(`wet_shirt_${Date.now()}`, this.scene);

        const originalMeshes = this.originalModel.getChildMeshes();

        originalMeshes.forEach((mesh, index) => {
            const clonedMesh = mesh.clone(`${mesh.name}_wet_${index}`, clonedRoot);

            if (clonedMesh) {
                if (mesh.material) {
                    const originalMaterial = mesh.material as PBRMaterial;
                    const clonedMaterial = originalMaterial.clone(`${originalMaterial.name}_wet`);
                    clonedMesh.material = clonedMaterial;
                }
            }
        });

        return clonedRoot;
    }

    public getCurrentState() : 'original' | 'wet' | 'transitioning' | 'hot' | 'cold' {
        if (this.isTransitioning) {
            return 'transitioning';
        } else if (this.wetModel) {
            return 'wet';
        } else if (this.hotModel) {
            return 'hot';
        } else if (this.coldModel) {
            return 'cold';
        } else {
            return 'original';
        }
    }

    private async cleanupActiveEffects(): Promise<void> {
        if (this.wetModel) {
            this.wetModel.dispose();
            this.wetModel = null;
        }
        if (this.hotModel) {
            this.hotModel.dispose();
            this.hotModel = null;
        }
        if( this.coldModel){
            this.coldModel.dispose();
            this.coldModel = null;
        }
    }

    getDisplayItemIds(): string[] {
        return ["shoe_display_1"];
    }

    update(): void {
        if (this.explodedViewComponent) {
            this.explodedViewComponent.update();
        }

    }

    isModelLoaded(): boolean {
        return this.isLoaded;
    }


    dispose(): void {
        if (this.explodedViewComponent) {
            this.explodedViewComponent.dispose();
        }
        this.materialEffectService.dispose();
        this.isLoaded = false;
    }

    private setupInspector(): void {
        // Create a toggle key for the inspector (Ctrl+Alt+I)
        window.addEventListener("keydown", (ev) => {
            // Ctrl+Alt+I to toggle inspector
            if (ev.ctrlKey && ev.altKey && ev.code === "KeyI") {
                if (Inspector.IsVisible) {
                    Inspector.Hide();
                } else {
                    Inspector.Show(this.scene, {
                        embedMode: true,
                    });
                }
            }
        });

    }

    public isInitialized(): boolean {
        // Return whether the component is fully initialized
        return this.scene !== undefined && this.scene !== null;
    }

    public onCanvasMoved(): void {
        try {
            if (!this.scene) return;
            const engine = this.scene.getEngine();
            if (!engine) return;
            engine.resize();
            // one extra delayed resize helps when layout transitions are animated
            setTimeout(() => engine.resize(), 120);

            // optional: adjust camera if needed
            if (this.scene.activeCamera) {
                // if ArcRotateCamera, refresh camera internals (safe guard)
                const cam: any = this.scene.activeCamera;
                if (typeof cam.rebuildAnglesAndRadius === "function") {
                    try { cam.rebuildAnglesAndRadius(); } catch { }
                }
            }
        } catch (err) {
            console.error("MallComponent.onCanvasMoved error:", err);
        }
    }
}
