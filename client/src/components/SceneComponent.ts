import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import { IComponent } from "../interfaces/IComponent";

export class SceneComponent implements IComponent {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private camera: ArcRotateCamera;
    private resizeObserver: ResizeObserver;
    private resizeHandler: () => void;
    private _resizeTimer?: number;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.resizeHandler = this.onResize.bind(this);
    }

    initialize(): void {
        this.camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 3, Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 1;
        this.camera.upperRadiusLimit = 1.5;
        // this.camera.wheelDeltaPercentage = 0.01;
        // this.camera.panningSensibility = 1000;
        this.camera.minZ = 0.01;
        this.camera.attachControl(this.canvas, true);
        this.camera.setTarget(Vector3.Zero());
        this.scene.activeCamera = this.camera;
        
        // Create light
        const light = new HemisphericLight("light1", new Vector3(1, 1, 0), this.scene);

        try {
            this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
            this.resizeObserver.observe(this.canvas);
            if (this.canvas.parentElement) this.resizeObserver.observe(this.canvas.parentElement);
        } catch (err) {
            console.warn("ResizeObserver not available:", err);
        }
    }

    update(): void {
        // Update scene-related logic here (if needed)
    }

    getCamera(): ArcRotateCamera {
        return this.camera;
    }
    private scheduleResize(): void {
        // throttle/debounce: only call resize after 80ms of quiescence
        if (this._resizeTimer) {
            window.clearTimeout(this._resizeTimer);
        }
        this._resizeTimer = window.setTimeout(() => {
            try {
                const engine = this.scene?.getEngine();
                if (engine) {
                    engine.resize();
                    // one short delayed resize to handle animated layout adjustments
                    window.setTimeout(() => {
                        try { engine.resize(); } catch { }
                    }, 120);
                }
            } catch (err) {
                console.error("Error during debounced resize:", err);
            } finally {
                this._resizeTimer = undefined;
            }
        }, 80);
    }
    private onResize(): void {
        try {
            const engine = this.scene?.getEngine();
            if (!engine) return;
            // run immediate and delayed resize to handle layout transitions
            engine.resize();
            setTimeout(() => engine.resize(), 120);
        } catch (err) {
            console.error("Error resizing engine:", err);
        }
    }

    dispose(): void {
        window.removeEventListener("resize", this.resizeHandler);
        if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = undefined; }
        if (this._resizeTimer) { window.clearTimeout(this._resizeTimer); this._resizeTimer = undefined; }
    }
}