import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { IComponent } from "./interfaces/IComponent";
import { SceneComponent } from "./components/SceneComponent";
import { CharacterComponent } from "./components/CharacterComponent";
import { NetworkManager } from "./components/NetworkManager";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import { MallComponent } from "./components/MallComponent";
import { ModelComponent } from "./components/ModelComponent";
import { AssetManager } from "./components/AssetManager";
import { ReactUIWrapper } from "./components/UI/ReactUIWrapper";

class App {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private components: IComponent[] = [];
    private reactUI: ReactUIWrapper;

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
            #renderCanvas {
                width: 100%;
                height: 100%;
                display: block;
                touch-action: none;
            }
        `;
        document.head.appendChild(style);

        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.id = "renderCanvas";
        document.body.appendChild(this.canvas);
    }

    private setupReactUI(mallComponent: MallComponent): void {
        this.reactUI = new ReactUIWrapper(mallComponent);
    }

    private createEngine() {
        this.engine = new Engine(this.canvas, true);
        const handleWindowResize = () => {
            if ((this as any)._engineResizeTimer) {
                window.clearTimeout((this as any)._engineResizeTimer);
            }
            (this as any)._engineResizeTimer = window.setTimeout(() => {
                try { this.engine.resize(); } catch (e) { console.warn("Engine resize failed:", e); }
                (this as any)._engineResizeTimer = undefined;
            }, 80);
        };
        window.addEventListener("resize", handleWindowResize);

        try {
            const canvasObserver = new ResizeObserver(() => {
                if ((this as any)._canvasResizeTimer) {
                    window.clearTimeout((this as any)._canvasResizeTimer);
                }
                (this as any)._canvasResizeTimer = window.setTimeout(() => {
                    try { this.engine.resize(); } catch (e) { console.warn("Engine resize failed:", e); }
                    (this as any)._canvasResizeTimer = undefined;
                }, 80);
            });
            canvasObserver.observe(this.canvas);
            (this as any)._canvasResizeObserver = canvasObserver;
        } catch (err) {
            console.warn("ResizeObserver not available for canvas:", err);
        }

        // store handler so it can be removed if you add cleanup later
        (this as any)._handleWindowResize = handleWindowResize;
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

        // const characterComponent = new CharacterComponent(this.scene);
        // this.addComponent(characterComponent);
        // await characterComponent.initialize();

        const assetManager = new AssetManager(this.scene);
        this.addComponent(assetManager);
        assetManager.initialize();

        const modelComponent = new ModelComponent(this.scene, assetManager);
        this.addComponent(modelComponent);
        await modelComponent.initialize();

        const mallComponent = new MallComponent(this.scene, modelComponent);
        this.addComponent(mallComponent);
        await mallComponent.initialize();

        this.setupReactUI(mallComponent);

        // const fpsCamera = characterComponent.getCamera();
        // if (fpsCamera) {
        //     //Dispose the previous camera if it exists
        //     const defaultCamera = scenecomponent.getCamera();
        //     if (defaultCamera && defaultCamera.id !== fpsCamera.id) {w
        //         defaultCamera.dispose();
        //     }
        //     this.scene.activeCamera = fpsCamera;
        // } else {
        //     console.warn("Follow camera not initialized in CharacterComponent");
        // }

        // const networkManager = new NetworkManager(this.scene, characterComponent);
        // this.addComponent(networkManager);
        // networkManager.initialize();
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