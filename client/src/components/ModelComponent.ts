import { Scene, Vector3, AssetContainer, TransformNode, AbstractMesh, Mesh, HighlightLayer, Color3, PointerEventTypes } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";
import { AssetManager } from "./AssetManager";

export class ModelComponent implements IComponent {
    private scene: Scene;
    private assetManager: AssetManager;
    private modelRoots: Map<string, TransformNode> = new Map();
    constructor(scene: Scene, assetManager: AssetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
    }

    async initialize(): Promise<void> {
        console.log("ModelComponent initialized");
    }

    async update(): Promise<void> {}

    async loadModel(id: string, modelUrl: string): Promise<string> {
        try{
            const modelRoot = new TransformNode(`model_root_${id}`, this.scene);
            this.modelRoots.set(id, modelRoot)

            const assetContainer = await this.assetManager.loadAsset(id, modelUrl);
            assetContainer.addAllToScene();


            if(assetContainer.animationGroups.length > 0){
                assetContainer.animationGroups.forEach(anim => anim.stop());
            }
            return id;
        }
        catch(error){
            console.error("Error loading model:", error);
            throw error;
        }
    }

    getModelRoot(id:string): TransformNode | undefined{
        return this.modelRoots.get(id);
    }

    dispose(): void {
        this.modelRoots.forEach((root) => {
            root.dispose();
        });
        this.modelRoots.clear();
    }
}