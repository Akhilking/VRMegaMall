import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { IComponent } from "./components/IComponent";
import { SceneComponent } from "./components/SceneComponent";
import { CharacterComponent } from "./components/CharacterComponent";
import { NetworkManager } from "./components/NetworkManager";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import { MallComponent } from "./components/MallComponent";

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private components: IComponent[] = [];

    constructor() {
        this.setupCanvas();
        this.createEngine();
        this.createScene();
        this.registerComponents();
        this.setupInspector();
        this.startRenderLoop();
    }
    private setupCanvas() {
        // Add CSS to ensure full screen coverage
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
            #gameCanvas {
                width: 100%;
                height: 100%;
                display: block;
                touch-action: none;
            }
        `;
        document.head.appendChild(style);

        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);
    }

    private createEngine() {
        this.engine = new Engine(this.canvas, true);
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    private createScene() {
        this.scene = new Scene(this.engine);
    }

    private addComponent(component: IComponent): void {
        this.components.push(component);
    }
    private async registerComponents(): Promise<void> {
        const scenecomponent = new SceneComponent(this.scene, this.canvas);
        this.addComponent(scenecomponent);
        scenecomponent.initialize();

        const characterComponent = new CharacterComponent(this.scene);
        this.addComponent(characterComponent);
        await characterComponent.initialize();

        const mallComponent = new MallComponent(this.scene);
        this.addComponent(mallComponent);
        await mallComponent.initialize();

        const fpsCamera = characterComponent.getCamera();
        if (fpsCamera) {
            //Dispose the previous camera if it exists
            const defaultCamera = scenecomponent.getCamera();
            if (defaultCamera && defaultCamera.id !== fpsCamera.id) {
                defaultCamera.dispose();
            }
            this.scene.activeCamera = fpsCamera;
        } else {
            console.warn("Follow camera not initialized in CharacterComponent");
        }

        const networkManager = new NetworkManager(this.scene, characterComponent);
        this.addComponent(networkManager);
        networkManager.initialize();
    }
    private setupInspector(): void {
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });
    }
    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            this.components.forEach(component => component.update());
            this.scene.render();
        });
    }
}
new App();