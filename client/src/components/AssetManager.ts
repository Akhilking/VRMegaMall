import { Scene, Vector3, AssetContainer, TransformNode, AbstractMesh, Mesh, HighlightLayer, Color3, PointerEventTypes } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";

export class AssetManager implements IComponent {
    private scene: Scene;
    private assetContainers : Map<string, AssetContainer> = new Map();
    private loadingPromises : Map<string, Promise<AssetContainer>> = new Map();
    constructor(scene: Scene) {
        this.scene = scene;
    }

    async initialize(): Promise<void> {
        console.log("ModelComponent initialized");
    }

    async update(): Promise<void> {}

    async loadAsset(id: string, modelUrl: string): Promise<AssetContainer> {
        if(this.assetContainers.has(id)) {
            return this.assetContainers.get(id)!;
        }

        if(this.loadingPromises.has(id)){
            return this.loadingPromises.get(id)!;
        }

        const loadPromise = LoadAssetContainerAsync(modelUrl,this.scene)
            .then(container => {
                this.assetContainers.set(id,container);
                this.loadingPromises.delete(id);
                return container;
            })
            .catch(error => {
                this.loadingPromises.delete(id);
                throw error;
            });
        this.loadingPromises.set(id, loadPromise);
        return loadPromise;
    }

    getAsset(id: string): void{
        const container = this.assetContainers.get(id);
        if(container){
            container.addAllToScene();
        }
    }

    addAssetToScene(id: string): void {
        const container = this.assetContainers.get(id);
        if(container){
            container.addAllToScene();
        }
    }

    removeAssetFromScene(id: string): void {
        const container = this.assetContainers.get(id);
        if(container){
            container.removeAllFromScene();
        }
    }

    dispose():void{
        this.assetContainers.forEach((container,id) =>{
            container.dispose();

        });
        this.assetContainers.clear();
        this.loadingPromises.clear();
    }
}