import {Scene, Vector3, AssetContainer, TransformNode } from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core";
import "@babylonjs/loaders";
import { IComponent } from "./IComponent"; 

export class MallComponent implements IComponent {
    private scene:Scene;
    private mallMesh : any;
    private isLoading : boolean = false;
    private isLoaded : boolean = false;
    private assetContainer: AssetContainer | null = null;
    private mallRoot: TransformNode | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    initialize(): void {
        console.log("MallComponent initialized");
        this.isLoading = true;

        this.loadMallModel().then(() => {
            this.isLoaded = true;
            this.isLoading = false;
        }).catch(error => {
            console.error("Error loading mall model:", error);
            this.isLoading = false;
        });
    }

    private async loadMallModel(): Promise<void> {
        try{
            this.assetContainer = await LoadAssetContainerAsync(
                "./assets/models/mall.glb",
                this.scene,
            );

            const result = this.assetContainer.addAllToScene();
            this.mallRoot = new TransformNode("mallRoot", this.scene);
            this.mallMesh = this.assetContainer.meshes[0];

            if(this.mallMesh){
                this.mallMesh.parent = this.mallRoot;
                this.mallRoot.position = Vector3.Zero();
                this.mallRoot.scaling.setAll(1);

                this.assetContainer.meshes.forEach((mesh) => {
                    if(mesh !== this.mallMesh){
                        mesh.freezeWorldMatrix();
                    }
                    mesh.doNotSyncBoundingInfo = true;
                });
                this.scene.skipFrustumClipping = false;
            }
            console.log("Mall model loaded successfully.");
        }
        catch (error) {
            console.error("Error loading mall model:", error);
        }
    }


    update():void{

    }

    isModelLoaded(): boolean {
        return this.isLoaded;
    }

    getMallRoot(): TransformNode | null {
        return this.mallRoot;
    }

    dispose(): void {
        if (this.assetContainer) {
            this.assetContainer.removeAllFromScene();
            this.assetContainer.dispose();
            this.mallMesh = null;
        }
    }

}
