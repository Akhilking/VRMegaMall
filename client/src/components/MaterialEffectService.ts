import {
    Scene, Color3, PBRMaterial, StandardMaterial, FresnelParameters,
    AbstractMesh, ParticleSystem, Texture, Color4, Vector3, TransformNode,
    Material,
    DynamicTexture
} from "@babylonjs/core";


export class MaterialEffectService {
    private scene: Scene;
    private activeEffects: Map<string, ParticleSystem[]> = new Map();

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Apply wet effect to all materials in a model
     * @param modelRoot The root TransformNode of the model
     * @param wetnessLevel How wet the material should appear (0-1)
     * @param addDroplets Whether to add water droplet particles
     * @returns Identifier for the applied effect
     */
    applyWetEffect(modelRoot: TransformNode, wetnessLevel: number = 0.8, addDroplets: boolean = true): string {
        if (!modelRoot) {
            console.error("Invalid model root");
            return "";
        }

        const effectId = `wet_${modelRoot.name}_${Date.now()}`;
        const dropletSystems: ParticleSystem[] = [];

        const meshes = modelRoot.getChildMeshes();
        console.log(`Applying wet effect to ${meshes.length} meshes in model ${modelRoot.name}`);

        meshes.forEach(mesh => {
            if (mesh.material) {
                this.makeWet(mesh.material, wetnessLevel);

                // Add water droplets if requested and mesh is large enough
                if (addDroplets && mesh.getBoundingInfo().boundingSphere.radius > 0.1) {
                    const droplets = this.addWaterDroplets(mesh);
                    dropletSystems.push(droplets);
                }
            }
        });

        if (dropletSystems.length > 0) {
            this.activeEffects.set(effectId, dropletSystems);
        }

        console.log(`Wet effect applied with ID: ${effectId}`);
        return effectId;
    }


    /**
    * Make a material look wet
    * @param material The material to modify
    * @param wetnessLevel How wet the material should appear (0-1)
    */
    makeWet(material: Material, wetnessLevel: number = 0.8): void {
        if (material instanceof PBRMaterial) {
            const pbrMat = material as PBRMaterial;

            if (pbrMat.albedoColor) {
                pbrMat.albedoColor = pbrMat.albedoColor.scale(1 - (wetnessLevel * 0.2));
            }

            pbrMat.roughness = Math.max(0.1, pbrMat.roughness - (wetnessLevel * 0.6));

            pbrMat.metallic = Math.min(0.3, pbrMat.metallic + (wetnessLevel * 0.2));

            pbrMat.clearCoat.isEnabled = true;
            pbrMat.clearCoat.intensity = wetnessLevel * 0.8;
            pbrMat.clearCoat.roughness = 0.1;

        } else if (material instanceof StandardMaterial) {
            const stdMat = material as StandardMaterial;

            if (stdMat.diffuseColor) {
                stdMat.diffuseColor = stdMat.diffuseColor.scale(1 - (wetnessLevel * 0.2));
            }

            stdMat.specularColor = new Color3(1, 1, 1);
            stdMat.specularPower = 128 * wetnessLevel;

            stdMat.reflectionFresnelParameters = new FresnelParameters();
            stdMat.reflectionFresnelParameters.bias = 0.02;
            stdMat.reflectionFresnelParameters.power = 2.5;
            stdMat.reflectionFresnelParameters.leftColor = Color3.White();
            stdMat.reflectionFresnelParameters.rightColor = Color3.Black();
        }

        material.markAsDirty(Material.AllDirtyFlag);
    }

    /**
     * Add water droplets to a mesh
     * @param mesh The mesh to add droplets to
     * @returns The created particle system
     */
    private addWaterDroplets(mesh: AbstractMesh): ParticleSystem {
        // Create a simple dynamic texture for water droplets
        const textureSize = 64;
        const dynamicTexture = new DynamicTexture("dropletTexture", textureSize, this.scene, true);
        const ctx = dynamicTexture.getContext();

        // Clear background
        ctx.clearRect(0, 0, textureSize, textureSize);

        // Draw a simple water droplet (blue circle with white highlight)
        const center = textureSize / 2;
        const radius = textureSize / 2.5;

        // Main droplet body
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
        gradient.addColorStop(0, 'rgba(200, 230, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(center - radius / 3, center - radius / 3, radius / 5, 0, Math.PI * 2);
        ctx.fill();

        dynamicTexture.update();

        // Create particle system
        const droplets = new ParticleSystem("droplets", 80, this.scene);
        droplets.particleTexture = dynamicTexture;
        droplets.emitter = mesh;

        const bbox = mesh.getBoundingInfo().boundingBox;

        droplets.minEmitBox = new Vector3(
            bbox.minimumWorld.x * 0.8,
            bbox.maximumWorld.y * 0.9, // Start from near the top
            bbox.maximumWorld.z * 0.8  // Stay towards the front
        );
        droplets.maxEmitBox = new Vector3(
            bbox.maximumWorld.x * 0.8,
            bbox.maximumWorld.y,
            bbox.maximumWorld.z
        );

        // Simple colors
        droplets.color1 = new Color4(1, 1, 1, 1);
        droplets.color2 = new Color4(1, 1, 1, 1);
        droplets.colorDead = new Color4(1, 1, 1, 0);

        // Simple sizes
        droplets.minSize = 0.015;
        droplets.maxSize = 0.045;

        // FASTER timing
        droplets.minLifeTime = 2;
        droplets.maxLifeTime = 4;
        droplets.emitRate = 15;

        // FASTER physics
        droplets.gravity = new Vector3(0, -0.08, 0);
        droplets.minEmitPower = 0.02;
        droplets.maxEmitPower = 0.05;

        // Emit mainly downward and forward (not backward)
        droplets.direction1 = new Vector3(-0.2, -1.5, 0.1);  // Slightly forward
        droplets.direction2 = new Vector3(0.2, -1.5, 0.5);   // More forward

        droplets.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        droplets.start();

        return droplets;
    }

    /**
 * Apply cotton texture material to all meshes in a model
 * @param modelRoot The root TransformNode of the model
 * @param cottonColor Optional color tint for the cotton (default: white)
 * @returns Identifier for the applied effect
 */
    applyCottonMaterial(modelRoot: TransformNode, cottonColor: Color3 = new Color3(1, 1, 1)): string {
        if (!modelRoot) {
            console.error("Invalid model root");
            return "";
        }

        const effectId = `cotton_${modelRoot.name}_${Date.now()}`;
        const meshes = modelRoot.getChildMeshes();

        meshes.forEach(mesh => {
            // Dispose old material if it exists
            if (mesh.material) {
                mesh.material.dispose();
            }

            // Create natural cotton material
            const cottonMat = new PBRMaterial(`cotton_${mesh.name}`, this.scene);

            // NATURAL cotton properties - darker and more muted
            cottonMat.albedoColor = cottonColor.scale(0.7); // Tone down brightness by 30%
            cottonMat.roughness = 0.9; // Higher roughness for more natural fabric look
            cottonMat.metallic = 0.0;  // Keep non-metallic

            // Add cotton texture with subtle effect
            cottonMat.bumpTexture = this.createFabricBumpTexture();
            cottonMat.bumpTexture.level = 0.15; // Very subtle bump

            // Natural fabric properties
            cottonMat.clearCoat.isEnabled = false;
            cottonMat.subSurface.isScatteringEnabled = false;

            // Remove any artificial glow
            cottonMat.emissiveColor = new Color3(0, 0, 0); // No emission

            // Natural fabric reflectance
            cottonMat.indexOfRefraction = 1.0; // No refraction like real fabric

            mesh.material = cottonMat;
        });

        return effectId;
    }
    /**
     * Create a simple fabric bump texture
     */
    private createFabricBumpTexture(): DynamicTexture {
        const textureSize = 512; // Higher resolution for better detail
        const fabricTexture = new DynamicTexture("fabricBump", textureSize, this.scene, true);
        const ctx = fabricTexture.getContext();

        // Base fabric color - neutral gray
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, textureSize, textureSize);

        // Create realistic cotton weave pattern
        const threadWidth = 8;
        const threadSpacing = 12;

        // Horizontal threads (warp)
        ctx.fillStyle = '#999999'; // Slightly lighter
        for (let y = 0; y < textureSize; y += threadSpacing) {
            ctx.fillRect(0, y, textureSize, threadWidth);

            // Add thread texture variation
            ctx.fillStyle = '#777777';
            ctx.fillRect(0, y + 2, textureSize, 2);
            ctx.fillStyle = '#999999';
        }

        // Vertical threads (weft) - interlaced
        ctx.fillStyle = '#949494';
        for (let x = 0; x < textureSize; x += threadSpacing) {
            for (let y = 0; y < textureSize; y += threadSpacing * 2) {
                ctx.fillRect(x, y, threadWidth, threadSpacing);
            }

            // Offset pattern for weave effect
            for (let y = threadSpacing; y < textureSize; y += threadSpacing * 2) {
                ctx.fillRect(x, y, threadWidth, threadSpacing);
            }
        }

        // Add subtle cotton fiber texture
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * textureSize;
            const y = Math.random() * textureSize;
            const size = Math.random() * 3 + 1;

            ctx.fillStyle = Math.random() > 0.5 ? '#AAAAAA' : '#666666';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0; // Reset alpha
        fabricTexture.update();
        return fabricTexture;
    }

    /**
     * Apply cotton material with different colors (reusable)
     */
    applyWhiteCotton(modelRoot: TransformNode): string {
        return this.applyCottonMaterial(modelRoot, new Color3(1, 1, 1));
    }

    applyBlueCotton(modelRoot: TransformNode): string {
        return this.applyCottonMaterial(modelRoot, new Color3(0.4, 0.6, 0.9));
    }

    applyGrayCotton(modelRoot: TransformNode): string {
        return this.applyCottonMaterial(modelRoot, new Color3(0.7, 0.7, 0.7));
    }

    applyBlackCotton(modelRoot: TransformNode): string {
        return this.applyCottonMaterial(modelRoot, new Color3(0.2, 0.2, 0.2));
    }

    /**
     * Stop a specific effect by its ID
     * @param effectId The ID of the effect to stop
     */
    stopEffect(effectId: string): void {
        const systems = this.activeEffects.get(effectId);
        if (systems) {
            systems.forEach(system => {
                system.stop();
            });
            console.log(`Stopped effect: ${effectId}`);
        }
    }

    /**
     * Dispose of a specific effect and its resources
     * @param effectId The ID of the effect to dispose
     */
    disposeEffect(effectId: string): void {
        const systems = this.activeEffects.get(effectId);
        if (systems) {
            systems.forEach(system => {
                system.dispose();
            });
            this.activeEffects.delete(effectId);
            console.log(`Disposed effect: ${effectId}`);
        }
    }

    /**
     * Dispose all effects and clean up resources
     */
    dispose(): void {
        this.activeEffects.forEach((systems) => {
            systems.forEach(system => system.dispose());
        });
        this.activeEffects.clear();
        console.log("Material effects service disposed");
    }
}