import { Scene, Vector3, AssetContainer, TransformNode, ArcRotateCamera, StandardMaterial, Texture, Color3, Material, FresnelParameters, PBRMaterial, AbstractMesh, Particle, ParticleSystem, Color4, DirectionalLight, HemisphericLight, MeshBuilder } from "@babylonjs/core";
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

    constructor(scene: Scene, modelComponent: ModelComponent) {
        this.scene = scene;
        this.modelComponent = modelComponent;
        this.materialEffectService = new MaterialEffectService(scene);
    }

    async initialize(): Promise<void> {
        this.createShowroom();
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
            const shoeModel = await this.modelComponent.loadModel(
                "shoe_display",
                "./assets/models/t_shirt.glb",
            );
            console.log("Shoe model loaded with ID:", shoeModel);

            const shoeModel_1 = await this.modelComponent.loadModel(
                "shoe_display_1",
                "./assets/models/t_shirt.glb",
            );
            // this.explodedViewComponent = new ExplodedViewComponent(
            //     this.scene,
            //     this.modelComponent,
            //     shoeModel
            // );
            // await this.explodedViewComponent.initialize();
            // await this.applyMaterialFromPNG(shoeModel, "./assets/shirtTexture.png");

            const materialId = this.materialEffectService.applyCottonMaterial(shoeModel, new Color3(0, 1, 1));
            shoeModel_1.position = new Vector3(1, 0, 0);

            const materialId_1 = this.materialEffectService.applyCottonMaterial(shoeModel_1, new Color3(0, 1, 1));
            const effectId = this.materialEffectService.applyWetEffect(shoeModel_1, 0.9, false);
            this.activeEffects.set("shoe_display_1", effectId);
            this.setupInspector();
            this.isLoaded = true;
            console.log("Mall Models loaded Successfully")
        }
        catch (error) {
            console.error("Error initializing mall model:", error);
        }
    }

    private createShowroom(): void {
        const boxSize = 10;
        const showroomBox = MeshBuilder.CreateBox("showroom", { size: boxSize }, this.scene);

        const whiteMaterial = new StandardMaterial("showroomMaterial", this.scene);
        whiteMaterial.diffuseColor = new Color3(0.95, 0.95, 0.95); // Slightly off-white
        whiteMaterial.specularColor = new Color3(0, 0, 0);

        showroomBox.material = whiteMaterial;
        showroomBox.flipFaces(true);


        const mainLight = new DirectionalLight("mainLight", new Vector3(-0.5, -1, -0.3), this.scene);
        mainLight.intensity = 0.4; // Reduced from 0.8

        const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.3; // Reduced from 0.6

        const fillLight = new DirectionalLight("fillLight", new Vector3(0.3, -0.5, 0.2), this.scene);
        fillLight.intensity = 0.2; // Much softer fill

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

}
