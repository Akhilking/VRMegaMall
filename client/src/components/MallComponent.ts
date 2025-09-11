import { Scene, Vector3, AssetContainer, TransformNode } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";
import { ModelComponent } from "./ModelComponent";

export class MallComponent implements IComponent {
    private scene: Scene;
    private modelComponent: ModelComponent;
    private isLoaded: boolean = false;


    constructor(scene: Scene, modelComponent: ModelComponent) {
        this.scene = scene;
        this.modelComponent = modelComponent;
    }

    async initialize(): Promise<void> {
        try {
            await this.modelComponent.loadModel(
                "mall_structure",
                "./assets/models/mall.glb",
                {
                    position: Vector3.Zero(),
                    scaling: new Vector3(1, 1, 1),
                    useCache: true,
                    isInteractable: true
                }
            );
            await this.modelComponent.loadModel(
                "shoe_display_1",
                "./assets/models/shoe.glb",
                {
                    position: new Vector3(0, 0, 5),
                    scaling: new Vector3(5, 5, 5),
                    useCache: true,
                    isInteractable: true
                }
            );

            this.isLoaded = true;
            console.log("Mall Models loaded Successfully")
        }
        catch (error) {
            console.error("Error initializing mall model:", error);
        }
    }

    getDisplayItemIds(): string[] {
        return ["shoe_display_1"];
    }

    update(): void {

    }

    isModelLoaded(): boolean {
        return this.isLoaded;
    }


    dispose(): void {
        this.isLoaded = false;
    }

}
