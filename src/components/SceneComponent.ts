import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import { IComponent } from "./IComponent";

export class SceneComponent implements IComponent {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private camera: ArcRotateCamera;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
    }

    initialize(): void {
        // Create camera
        this.camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas, true);

        this.scene.activeCamera = this.camera;
        
        // Create light
        const light = new HemisphericLight("light1", new Vector3(1, 1, 0), this.scene);
        
        // Create ground
        const ground = MeshBuilder.CreateGround("ground", {width: 10, height: 10}, this.scene);
        ground.position.y = -1;
    }

    update(): void {
        // Update scene-related logic here (if needed)
    }

    getCamera(): ArcRotateCamera {
        return this.camera;
    }
}