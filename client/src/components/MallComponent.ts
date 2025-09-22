import { Scene, Vector3, AssetContainer, TransformNode, ArcRotateCamera } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent";
import { ModelComponent } from "./ModelComponent";
import { ExplodedViewComponent } from "./ExplodedViewComponent";
import { Inspector } from "@babylonjs/inspector";

export class MallComponent implements IComponent {
    private scene: Scene;
    private modelComponent: ModelComponent;
    private explodedViewComponent: ExplodedViewComponent | null = null;
    private isLoaded: boolean = false;
    private defaultCamera: ArcRotateCamera;

    constructor(scene: Scene, modelComponent: ModelComponent) {
        this.scene = scene;
        this.modelComponent = modelComponent;
    }

    async initialize(): Promise<void> {
        try {
            // await this.modelComponent.loadModel(
            //     "mall_structure",
            //     "./assets/models/mall.glb",
            //     {
            //         position: Vector3.Zero(),
            //         scaling: new Vector3(1, 1, 1),
            //         useCache: true,
            //         isInteractable: true
            //     }
            // );
            // this.setupDefaultCamera();
            const shoeID = await this.modelComponent.loadModel(
                "shoe_display_1",
                "./assets/models/Shoe_Exploded.glb",
            );

            console.log("Shoe model loaded with ID:", shoeID);
            // this.explodedViewComponent = new ExplodedViewComponent(
            //     this.scene,
            //     this.modelComponent,
            //     shoeID
            // );
            // await this.explodedViewComponent.initialize();
            this.setupInspector();
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
        if(this.explodedViewComponent) {
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
        this.isLoaded = false;
    }

     private setupDefaultCamera(): void {
        // Create an arc rotate camera focused on the center
        this.defaultCamera = new ArcRotateCamera(
            "defaultCamera", 
            Math.PI / 2,   // Alpha (horizontal rotation)
            Math.PI / 3,   // Beta (vertical rotation)
            20,            // Radius (distance from target)
            new Vector3(0, 0, 0), // Target position (center)
            this.scene
        );
        
        // Set as active camera
        this.scene.activeCamera = this.defaultCamera;
        
        // Enable camera controls
        const canvas = this.scene.getEngine().getRenderingCanvas();
        this.defaultCamera.attachControl(canvas, true);
        
        // Customize camera behavior
        this.defaultCamera.lowerRadiusLimit = 5;
        this.defaultCamera.upperRadiusLimit = 50;
        this.defaultCamera.wheelDeltaPercentage = 0.01;
        this.defaultCamera.panningSensibility = 1000;
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

}
