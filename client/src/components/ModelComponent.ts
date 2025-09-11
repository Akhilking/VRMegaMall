import { Scene, Vector3, AssetContainer, TransformNode, AbstractMesh, Mesh, HighlightLayer, Color3, PointerEventTypes } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";

// Cache for model reuse
const modelCache: Map<string, AssetContainer> = new Map();

export interface ModelOptions {
    position?: Vector3;
    rotation?: Vector3;
    scaling?: Vector3;
    isInteractable?: boolean;
    useCache?: boolean;
}

// Structure to track each loaded model
interface LoadedModel {
    id: string;
    modelRoot: TransformNode;
    mainMesh: AbstractMesh | null;
    assetContainer: AssetContainer;
    isInteractable: boolean;
    isPickedUp: boolean;
    holdingPlayer: any | null;
}

export class ModelComponent implements IComponent {
    private scene: Scene;
    private models: Map<string, LoadedModel> = new Map();
    private highlightLayer: HighlightLayer;

    constructor(scene: Scene) {
        this.scene = scene;
        this.highlightLayer = new HighlightLayer("modelHighlightLayer", this.scene);
    }

    async initialize(): Promise<void> {
        // No initialization needed until loadModel is called
        console.log("ModelComponent initialized");
    }

    /**
     * Load a 3D model and add it to the scene
     * @param id Unique identifier for this model
     * @param modelUrl URL to the model file
     * @param options Position, rotation, scaling, and other options
     * @returns Promise resolving to the loaded model's ID
     */
    async loadModel(id: string, modelUrl: string, options: ModelOptions = {}): Promise<string> {
        try {
            if (this.models.has(id)) {
                console.warn(`Model with ID ${id} already exists. Use a unique ID.`);
                return id;
            }

            const defaultOptions = {
                position: options.position || Vector3.Zero(),
                rotation: options.rotation || Vector3.Zero(),
                scaling: options.scaling || Vector3.One(),
                isInteractable: options.isInteractable !== undefined ? options.isInteractable : false,
                useCache: options.useCache !== undefined ? options.useCache : true
            };

            // Create a root node for this model
            const modelRoot = new TransformNode(`model_${id}`, this.scene);
            modelRoot.position = defaultOptions.position as Vector3;
            modelRoot.rotation = new Vector3(
                (defaultOptions.rotation as Vector3).x,
                (defaultOptions.rotation as Vector3).y,
                (defaultOptions.rotation as Vector3).z
            );
            modelRoot.scaling = defaultOptions.scaling as Vector3;

            // Try to load from cache first
            let assetContainer: AssetContainer;
            if (defaultOptions.useCache && modelCache.has(modelUrl)) {
                console.log(`Loading model from cache: ${modelUrl}`);
                assetContainer = modelCache.get(modelUrl);
            } else {
                console.log(`Loading model from URL: ${modelUrl}`);
                assetContainer = await LoadAssetContainerAsync(
                    modelUrl,
                    this.scene
                );

                if (defaultOptions.useCache) {
                    modelCache.set(modelUrl, assetContainer);
                }
            }

            // Clone the models from the container to prevent shared instances
            const clonedContainer = new AssetContainer(this.scene);
            
            // Clone the meshes and add to the scene
            assetContainer.meshes.forEach(mesh => {
                const clone = mesh.clone(mesh.name, null);
                if (clone) {
                    clonedContainer.meshes.push(clone);
                    // No need to explicitly add to scene as we'll use addAllToScene()
                }
            });

            // Clone materials and textures if needed
            assetContainer.materials.forEach(mat => {
                clonedContainer.materials.push(mat.clone(mat.name));
            });

            // Add the cloned items to the scene
            clonedContainer.addAllToScene();

            // Find main mesh (mesh with most vertices or first mesh)
            const meshesWithVertices = clonedContainer.meshes.filter(
                mesh => mesh.getTotalVertices() > 0
            );
            
            const mainMesh = meshesWithVertices.length > 0 
                ? meshesWithVertices.reduce((prev, current) => 
                    (prev.getTotalVertices() > current.getTotalVertices()) ? prev : current)
                : clonedContainer.meshes[0];

            // Set up parent-child relationships
            if (mainMesh) {
                // Only parent root-level meshes to avoid circular references
                const rootMeshes = clonedContainer.meshes.filter(mesh => !mesh.parent);
                rootMeshes.forEach(mesh => {
                    mesh.parent = modelRoot;
                });

                // Make meshes pickable if interactable
                if (defaultOptions.isInteractable) {
                    clonedContainer.meshes.forEach(mesh => {
                        if (mesh.getTotalVertices() > 0) {
                            mesh.isPickable = true;
                        }
                    });
                    this.setupInteraction(id, mainMesh);
                }

                // Store the model in our map
                this.models.set(id, {
                    id,
                    modelRoot,
                    mainMesh,
                    assetContainer: clonedContainer,
                    isInteractable: defaultOptions.isInteractable as boolean,
                    isPickedUp: false,
                    holdingPlayer: null
                });

                console.log(`Model loaded successfully: ${id} (${modelUrl})`);
                return id;
            } else {
                throw new Error(`No valid meshes found in model: ${modelUrl}`);
            }
        } catch (error) {
            console.error(`Error loading model ${id} (${modelUrl}):`, error);
            throw error;
        }
    }

    private setupInteraction(modelId: string, mesh: AbstractMesh): void {
        if (!(mesh instanceof Mesh)) return;

        // Add hover effect
        this.scene.onPointerObservable.add((pointerInfo) => {
            const model = this.models.get(modelId);
            if (!model || model.isPickedUp || !model.isInteractable) return;

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                const pickResult = this.scene.pick(
                    this.scene.pointerX,
                    this.scene.pointerY,
                    (pickMesh) => pickMesh === mesh || (mesh && pickMesh.isDescendantOf(mesh))
                );

                if (pickResult.hit) {
                    this.highlightLayer.addMesh(mesh, Color3.Yellow());
                    document.body.style.cursor = "pointer";
                } else {
                    this.highlightLayer.removeMesh(mesh);
                    document.body.style.cursor = "default";
                }
            }
        });
    }

    /**
     * Pick up a model
     * @param modelId ID of the model to pick up
     * @param character Character that's picking up the model
     * @returns true if pickup was successful
     */
    pickUpModel(modelId: string, character: any): boolean {
        const model = this.models.get(modelId);
        if (!model || model.isPickedUp || !model.isInteractable) return false;

        model.isPickedUp = true;
        model.holdingPlayer = character;

        if (model.mainMesh instanceof Mesh) {
            this.highlightLayer.removeMesh(model.mainMesh);
        }

        console.log(`Model picked up: ${modelId}`);
        return true;
    }

    /**
     * Drop a previously picked up model
     * @param modelId ID of the model to drop
     */
    dropModel(modelId: string): void {
        const model = this.models.get(modelId);
        if (!model || !model.isPickedUp) return;

        model.isPickedUp = false;
        model.holdingPlayer = null;

        console.log(`Model dropped: ${modelId}`);
    }

    /**
     * Rotate a model
     * @param modelId ID of the model to rotate
     * @param axis Axis to rotate around (x, y, z)
     * @param amount Amount to rotate by
     */
    rotateModel(modelId: string, axis: string, amount: number): void {
        const model = this.models.get(modelId);
        if (!model) return;

        switch (axis.toLowerCase()) {
            case "x": model.modelRoot.rotation.x += amount; break;
            case "y": model.modelRoot.rotation.y += amount; break;
            case "z": model.modelRoot.rotation.z += amount; break;
        }
    }

    /**
     * Scale a model
     * @param modelId ID of the model to scale
     * @param amount Amount to scale by
     */
    scaleModel(modelId: string, amount: number): void {
        const model = this.models.get(modelId);
        if (!model) return;

        const newScale = model.modelRoot.scaling.x + amount;
        if (newScale > 0.01) {
            model.modelRoot.scaling.setAll(newScale);
        }
    }

    /**
     * Set the position of a model
     * @param modelId ID of the model to position
     * @param position New position
     */
    setModelPosition(modelId: string, position: Vector3): void {
        const model = this.models.get(modelId);
        if (!model) return;

        model.modelRoot.position = position;
    }

    /**
     * Get the root TransformNode of a model
     * @param modelId ID of the model
     * @returns The model's root TransformNode or null if not found
     */
    getModelRoot(modelId: string): TransformNode | null {
        return this.models.get(modelId)?.modelRoot || null;
    }

    /**
     * Get the main mesh of a model
     * @param modelId ID of the model
     * @returns The model's main mesh or null if not found
     */
    getModelMesh(modelId: string): AbstractMesh | null {
        return this.models.get(modelId)?.mainMesh || null;
    }

    /**
     * Check if a model is being held
     * @param modelId ID of the model to check
     * @returns true if the model is being held
     */
    isModelPickedUp(modelId: string): boolean {
        return this.models.get(modelId)?.isPickedUp || false;
    }

    /**
     * Get all model IDs
     * @returns Array of model IDs
     */
    getAllModelIds(): string[] {
        return Array.from(this.models.keys());
    }

    update(): void {
        // Update picked up models
        this.models.forEach(model => {
            if (model.isPickedUp && model.holdingPlayer) {
                const characterRoot = model.holdingPlayer.getCharacterRoot();
                if (characterRoot) {
                    // Position model in front of character
                    const forward = characterRoot.forward.scale(0.5);
                    const targetPosition = characterRoot.position.clone().add(forward);
                    targetPosition.y += 1.2;

                    // Smooth movement
                    model.modelRoot.position = Vector3.Lerp(
                        model.modelRoot.position,
                        targetPosition,
                        0.2
                    );
                }
            }
        });
    }

    /**
     * Remove a model
     * @param modelId ID of the model to remove
     */
    removeModel(modelId: string): void {
        const model = this.models.get(modelId);
        if (!model) return;

        model.assetContainer.removeAllFromScene();
        model.assetContainer.dispose();
        model.modelRoot.dispose();

        this.models.delete(modelId);
        console.log(`Model removed: ${modelId}`);
    }

    dispose(): void {
        // Clean up all models
        this.models.forEach((model, id) => {
            this.removeModel(id);
        });

        this.models.clear();
        
        if (this.highlightLayer) {
            this.highlightLayer.dispose();
        }
    }
}