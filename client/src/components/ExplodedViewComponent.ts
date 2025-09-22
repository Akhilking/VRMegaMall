import {
    Scene,
    Vector3,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Color4,
    TransformNode,
    Animation,
    AbstractMesh,
    LinesMesh,
    HighlightLayer,
    Nullable,
    ShaderMaterial,
    Effect,
    Material,
    Node,
    Engine,
    VertexBuffer
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, StackPanel, TextBlock } from "@babylonjs/gui";
import { IComponent } from "./IComponent";
import { ModelComponent } from "./ModelComponent";

Effect.ShadersStore["xrayVertexShader"] = `
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    uniform mat4 world;
    uniform mat4 viewProjection;
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    varying vec2 vUV;
    void main() {
        vec4 worldPos = world * vec4(position, 1.0);
        gl_Position = viewProjection * worldPos;
        vPositionW = worldPos.xyz;
        vNormalW = mat3(world) * normal;
        vUV = uv;
    }
`;

Effect.ShadersStore["xrayFragmentShader"] = `
    precision highp float;
    uniform vec3 cameraPosition;
    uniform vec3 glowColor;
    uniform float alpha;
    uniform float edgeIntensity;
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    varying vec2 vUV;
    void main() {
        vec3 viewDir = normalize(cameraPosition - vPositionW);
        float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormalW))), edgeIntensity);
        gl_FragColor = vec4(glowColor, alpha * fresnel);
    }
`;

export enum VisualizationLayer {
    STANDARD = "standard",
    WIREFRAME = "wireframe",
    X_RAY = "xray",
    CONSTRUCTION = "construction"
}

interface ShoePartData {
    mesh: AbstractMesh;
    originalPosition: Vector3;
    originalParent: Nullable<Node>;
    explodedPosition: Vector3;
    connectionLine: Nullable<LinesMesh>;
    originalMaterial: Material;
    highlightMesh: Nullable<AbstractMesh>;
    layerMaterials: Map<VisualizationLayer, Material>;
    animations: Animation[];
    animationGroups: string[];
}

export class ExplodedViewComponent implements IComponent {
    private scene: Scene;
    private modelComponent: ModelComponent;
    private modelId: string;
    private isExploded: boolean = false;
    private isInXRayMode: boolean = false;
    private parts: Map<string, ShoePartData> = new Map();
    private mainRoot: TransformNode | null = null;
    private parentGroups: Map<string, AbstractMesh[]> = new Map();
    private explodeFactor: number = 1.5;
    private currentLayer: VisualizationLayer = VisualizationLayer.STANDARD;
    private highlightLayer: HighlightLayer;
    private selectedPart: string | null = null;
    private ui: AdvancedDynamicTexture | null = null;
    private explodeButton: Button | null = null;
    private layerButtons: Map<VisualizationLayer, Button> = new Map();
    private explodeAnimationGroups: string[] = [];
    private reassembleAnimationGroups: string[] = [];
    private playingGroupsBeforeExplode: string[] = [];
    constructor(scene: Scene, modelComponent: ModelComponent, modelId: string) {
        this.scene = scene;
        this.modelComponent = modelComponent;
        this.modelId = modelId;
        this.highlightLayer = new HighlightLayer("partHighlight", this.scene);
    }

    async initialize(): Promise<void> {
        try {
            console.log("Initializing ExplodedViewComponent");
            this.mainRoot = this.modelComponent.getModelRoot(this.modelId);
            if (!this.mainRoot) {
                throw new Error(`Model with ID ${this.modelId} not found in ModelComponent.`);
            }

            // const mainMesh = this.modelComponent.getModelMesh(this.modelId);
            // if (!mainMesh) {
            //     throw new Error(`Main mesh for model ID ${this.modelId} not found.`);
            // }

            await this.identifyAndPrepareParts(this.mainRoot);

            this.createUI();
            console.log("ExplodedViewComponent initialized successfully");
        }
        catch (error) {
            console.error("Error initializing ExplodedViewComponent:", error);
        }
    }

    private async identifyAndPrepareParts(mainMesh: TransformNode): Promise<void> {
        console.log(mainMesh)
        const childMeshes = mainMesh.getChildMeshes(true);
        const meshesToProcess = childMeshes.length > 0 ? childMeshes : [mainMesh];
        console.log(`Preparing ${meshesToProcess.length} parts for exploded view.`);

        const parentGroups = new Map<string, AbstractMesh[]>();
        childMeshes.forEach(mesh => {
            if (mesh instanceof Mesh) {
                const parent = mesh.parent;
                if (parent) {
                    const parentId = parent.id || parent.name;
                    if (!parentGroups.has(parentId)) {
                        parentGroups.set(parentId, []);
                    }
                    parentGroups.get(parentId)!.push(mesh);
                    // console.log(`Grouped mesh ${mesh.name} under parent ${parentId}`);
                }
            }
        });
        this.parentGroups = parentGroups;

        const modelCenter = this.calculateModelCenter();
        const animationGroups = this.scene.animationGroups;
        const parentAnimations = new Map<string, string[]>();
        animationGroups.forEach(group => {
            group.targetedAnimations.forEach(targetedAnim => {
                const target = targetedAnim.target;
                if (target && target.name) {
                    // Check if this target is a parent of any mesh
                    this.parentGroups.forEach((meshes, parentId) => {
                        if (target.name === parentId) {
                            console.log(`Animation group ${group.name} targets parent ${parentId}`);
                            // This animation targets a parent
                            if (!parentAnimations.has(parentId)) {
                                parentAnimations.set(parentId, []);
                            }
                            if (!parentAnimations.get(parentId)!.includes(group.name)) {
                                parentAnimations.get(parentId)!.push(group.name);
                                console.log(`Found animation ${group.name} for parent ${parentId}`);
                            }
                        }
                    });
                }
            });
        });

        meshesToProcess.forEach((mesh, index) => {
            if (mesh instanceof Mesh) {
                const partId = mesh.name || `part_${index}`;
                const meshPos = mesh.position.clone();

                const originalMaterial = mesh.material ?
                    mesh.material.clone(`${partId}_originalMaterial`) :
                    new StandardMaterial(`${partId}_defaultMaterial`, this.scene);


                const layerMaterials = this.createLayerMaterials(partId, originalMaterial);

                const meshAnimations = mesh.animations ? [...mesh.animations] : [];

                const belongsToGroups: string[] = [];
                animationGroups.forEach(group => {
                    group.targetedAnimations.forEach(targetedAnim => {
                        if (targetedAnim.target === mesh ||
                            (targetedAnim.target as any).name === mesh.name) {
                            belongsToGroups.push(group.name);
                        }
                    });
                });
                

                this.parts.set(partId, {
                    mesh: mesh,
                    originalPosition: mesh.position.clone(),
                    originalParent: mesh.parent,
                    explodedPosition: null,
                    connectionLine: null,
                    originalMaterial: null,
                    highlightMesh: null,
                    layerMaterials: null,
                    animations: mesh.animations || [],
                    animationGroups: [... new Set(belongsToGroups)]

                });

                mesh.isPickable = true;
            }
        });

        this.setupPartPicking();
    }

    private createLayerMaterials(partId: string, originalMaterial: Material): Map<VisualizationLayer, Material> {
        const materials = new Map<VisualizationLayer, Material>();

        // Standard Material
        materials.set(VisualizationLayer.STANDARD, originalMaterial);

        // Wireframe Material
        const wireframeMaterial = new StandardMaterial(`${partId}_wireframe`, this.scene);
        wireframeMaterial.wireframe = true;
        wireframeMaterial.emissiveColor = new Color3(0.5, 0.5, 1.0);
        materials.set(VisualizationLayer.WIREFRAME, wireframeMaterial);

        // X-Ray Material
        const xrayMaterial = new ShaderMaterial(`${partId}_xray`, this.scene, {
            vertex: "xray",
            fragment: "xray"
        },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "viewProjection", "cameraPosition", "glowColor", "alpha", "edgeIntensity"]
            });

        xrayMaterial.setVector3("cameraPosition", this.scene.activeCamera?.position);
        xrayMaterial.setVector3("glowColor", new Vector3(0.0, 0.7, 1.0));
        xrayMaterial.setFloat("alpha", 0.5);
        xrayMaterial.setFloat("edgeIntensity", 2.0);
        xrayMaterial.backFaceCulling = false;
        xrayMaterial.alphaMode = Engine.ALPHA_COMBINE;
        materials.set(VisualizationLayer.X_RAY, xrayMaterial);

        // Construction Material
        const constructionMaterial = new StandardMaterial(`${partId}_construction`, this.scene);
        constructionMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);
        constructionMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3);
        constructionMaterial.wireframe = false;
        constructionMaterial.useSpecularOverAlpha = true;
        materials.set(VisualizationLayer.CONSTRUCTION, constructionMaterial);

        return materials;
    }

    private setupPartPicking(): void {
        this.scene.onPointerDown = (evt, pickResult) => {
            // Ignore if not in exploded mode
            if (!this.isExploded) return;

            if (pickResult.hit && pickResult.pickedMesh) {
                const pickedMeshName = pickResult.pickedMesh.name;

                // Check if this is one of our parts
                if (this.parts.has(pickedMeshName)) {
                    // Deselect previous part
                    if (this.selectedPart) {
                        this.deselectPart(this.selectedPart);
                    }

                    // Select new part
                    this.selectPart(pickedMeshName);
                    this.selectedPart = pickedMeshName;
                } else {
                    // Clicked elsewhere, deselect current part
                    if (this.selectedPart) {
                        this.deselectPart(this.selectedPart);
                        this.selectedPart = null;
                    }
                }
            }
        };
    }

    private calculateModelCenter(): Vector3 {
        if (this.parts.size == 0) return Vector3.Zero();

        let totalX = 0;
        let totalY = 0;
        let totalZ = 0;
        let count = 0;

        this.parts.forEach(partData => {
            const pos = partData.originalPosition;
            totalX += pos.x;
            totalY += pos.y;
            totalZ += pos.z;
            count++;
        });
        return new Vector3(totalX / count, totalY / count, totalZ / count);
    }

    private selectPart(partId: string): void {
        const partData = this.parts.get(partId);
        if (!partData) return;

        // Highlight the part
        if (partData.mesh instanceof Mesh) {
            this.highlightLayer.addMesh(partData.mesh, Color3.Yellow());
        }

        // Zoom or focus on the part
        if (this.scene.activeCamera) {
            // TODO: Implement smooth camera movement to focus on this part
        }

        // Show part details UI
        this.showPartDetails(partId);

        console.log(`Selected part: ${partId}`);
    }

    private deselectPart(partId: string): void {
        const partData = this.parts.get(partId);
        if (!partData) return;

        // Remove highlight
        if (partData.mesh instanceof Mesh) {
            this.highlightLayer.removeMesh(partData.mesh);
        }

        // Hide part details UI
        this.hidePartDetails();

        console.log(`Deselected part: ${partId}`);
    }

    private showPartDetails(partId: string): void {
        // Create a detail panel for the selected part
        // This would show information about the part and allow for specific interactions

        // This is a placeholder - you would implement actual UI here
        console.log(`Showing details for part: ${partId}`);
    }

    private hidePartDetails(): void {
        // Remove the detail panel

        // This is a placeholder
        console.log("Hiding part details");
    }

    private createConnectionLines(): void {
        // Create lines connecting parts to their original positions

        // First, remove any existing lines
        this.parts.forEach(partData => {
            if (partData.connectionLine) {
                partData.connectionLine.dispose();
                partData.connectionLine = null;
            }
        });

        // Then create new lines
        this.parts.forEach(partData => {
            if (!this.mainRoot) return;

            // Create a line from part to center
            const positions = [
                partData.explodedPosition.clone(), // Current position
                partData.originalPosition.clone()  // Original position
            ];

            const colors = [
                new Color4(0.5, 0.5, 1.0, 1.0), // Blue at part
                new Color4(0.5, 0.5, 1.0, 0.2)  // Faded at origin
            ];

            const line = MeshBuilder.CreateLines(`${partData.mesh.name}_line`, {
                points: positions,
                colors: colors,
                updatable: true
            }, this.scene);

            line.alpha = 0.6;
            line.renderingGroupId = 1; // Ensure lines render on top

            partData.connectionLine = line;
        });
    }

    private removeConnectionLines(): void {
        this.parts.forEach(partData => {
            if (partData.connectionLine) {
                partData.connectionLine.dispose();
                partData.connectionLine = null;
            }
        });
    }

    private setVisualizationLayer(layer: VisualizationLayer): void {
        this.currentLayer = layer;

        // Update button states
        this.layerButtons.forEach((button, buttonLayer) => {
            button.background = buttonLayer === layer ? "green" : "#444444";
        });

        // Apply materials based on layer
        this.parts.forEach(partData => {
            const material = partData.layerMaterials.get(layer);
            if (material && partData.mesh instanceof Mesh) {
                partData.mesh.material = material;
            }
        });

        console.log(`Visualization layer set to: ${layer}`);
    }

    private explodeParts(): void {
        if (this.isExploded) return;

        console.log("Exploding parts...");

        // Set state
        this.isExploded = true;

        // Update button
        if (this.explodeButton) {
            this.explodeButton.textBlock!.text = "Reassemble";
            this.explodeButton.background = "red";
        }

        // Animate parts to exploded positions
        let foundExplodeAnims = false;
        // this.scene.animationGroups.forEach(group => {
            // if(group.name.toLowerCase().includes)
        // })

        // Create connection lines
        this.createConnectionLines();
    }

    private reassembleParts(): void {
        if (!this.isExploded) return;

        console.log("Reassembling parts...");

        // Set state
        this.isExploded = false;

        // Update button
        if (this.explodeButton) {
            this.explodeButton.textBlock!.text = "Explode View";
            this.explodeButton.background = "#444444";
        }

        // Deselect current part if any
        if (this.selectedPart) {
            this.deselectPart(this.selectedPart);
            this.selectedPart = null;
        }

        // Animate parts back to original positions
        this.parts.forEach(partData => {
            Animation.CreateAndStartAnimation(
                `reassemble_${partData.mesh.name}`,
                partData.mesh,
                "position",
                30, // frames per second
                60, // total frames (2 second animation)
                partData.mesh.position.clone(),
                partData.originalPosition.clone(),
                Animation.ANIMATIONLOOPMODE_CONSTANT,
                undefined,
                () => {
                    // Restore original parenting
                    partData.mesh.setParent(partData.originalParent);
                }
            );
        });

        // Remove connection lines
        this.removeConnectionLines();
    }

    private toggleExplodedView(): void {
        if (this.isExploded) {
            this.reassembleParts();
        } else {
            this.explodeParts();
        }
    }

    private createUI(): void {
        // Create fullscreen UI
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("ExplodedViewUI");

        // Create main panel
        const panel = new StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        panel.top = "20px";
        panel.paddingRight = "20px";
        this.ui.addControl(panel);

        // Title
        const title = new TextBlock();
        title.text = "Shoe Visualizer";
        title.height = "40px";
        title.color = "white";
        title.fontSize = 18;
        panel.addControl(title);

        // Explode button
        this.explodeButton = Button.CreateSimpleButton("explodeButton", "Explode View");
        this.explodeButton.width = "180px";
        this.explodeButton.height = "40px";
        this.explodeButton.color = "white";
        this.explodeButton.background = "#444444";
        this.explodeButton.onPointerUpObservable.add(() => {
            this.toggleExplodedView();
        });
        panel.addControl(this.explodeButton);

        // Visualization layer buttons
        const layerTitle = new TextBlock();
        layerTitle.text = "Visualization Layers";
        layerTitle.height = "30px";
        layerTitle.color = "white";
        layerTitle.fontSize = 14;
        layerTitle.paddingTop = "10px";
        panel.addControl(layerTitle);

        // Create buttons for each layer
        const layers = [
            { name: "Standard View", value: VisualizationLayer.STANDARD },
            { name: "Wireframe", value: VisualizationLayer.WIREFRAME },
            { name: "X-Ray", value: VisualizationLayer.X_RAY },
            { name: "Construction", value: VisualizationLayer.CONSTRUCTION }
        ];

        layers.forEach(layer => {
            const button = Button.CreateSimpleButton(`${layer.value}Button`, layer.name);
            button.width = "180px";
            button.height = "30px";
            button.color = "white";
            button.background = layer.value === this.currentLayer ? "green" : "#444444";
            button.onPointerUpObservable.add(() => {
                this.setVisualizationLayer(layer.value);
            });
            panel.addControl(button);
            this.layerButtons.set(layer.value, button);
        });

        // Help text
        const helpText = new TextBlock();
        helpText.text = "Click on parts to inspect\nUse layers to change view";
        helpText.height = "40px";
        helpText.color = "white";
        helpText.fontSize = 12;
        helpText.paddingTop = "10px";
        panel.addControl(helpText);
    }

    update(): void {
        // Update connection lines if in exploded view
        if (this.isExploded) {
            this.parts.forEach(partData => {
                if (partData.connectionLine) {
                    // Update the line's first point to follow the part
                    const line = partData.connectionLine as LinesMesh;
                    const positions = line.getVerticesData(VertexBuffer.PositionKind);
                    if (positions) {
                        const currentPos = partData.mesh.getAbsolutePosition();
                        positions[0] = currentPos.x;
                        positions[1] = currentPos.y;
                        positions[2] = currentPos.z;
                        line.updateVerticesData(VertexBuffer.PositionKind, positions);
                    }
                }
            });
        }

        // Update X-ray materials if camera has moved
        if (this.currentLayer === VisualizationLayer.X_RAY && this.scene.activeCamera) {
            this.parts.forEach(partData => {
                const xrayMaterial = partData.layerMaterials.get(VisualizationLayer.X_RAY);
                if (xrayMaterial && xrayMaterial instanceof ShaderMaterial) {
                    xrayMaterial.setVector3("cameraPosition", this.scene.activeCamera!.position);
                }
            });
        }
    }

    dispose(): void {
        // Remove UI
        if (this.ui) {
            this.ui.dispose();
        }

        // Clean up lines
        this.removeConnectionLines();

        // Restore original materials and parenting
        this.parts.forEach(partData => {
            if (partData.mesh instanceof Mesh) {
                partData.mesh.material = partData.originalMaterial;
                partData.mesh.setParent(partData.originalParent);
                partData.mesh.position = partData.originalPosition.clone();
            }
        });

        // Dispose highlight layer
        if (this.highlightLayer) {
            this.highlightLayer.dispose();
        }

        // Clear collections
        this.parts.clear();
        this.layerButtons.clear();
    }

}