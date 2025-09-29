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
        const waterSystems: ParticleSystem[] = [];

        const meshes = modelRoot.getChildMeshes();
        console.log(`Applying wet effect to ${meshes.length} meshes in model ${modelRoot.name}`);

        meshes.forEach(mesh => {
            if (mesh.material) {
                this.makeWet(mesh.material, wetnessLevel);

                // Add enhanced water effects if requested
                if (addDroplets && mesh.getBoundingInfo().boundingSphere.radius > 0.1) {
                    // Add main water droplets
                    const droplets = this.addWaterDroplets(mesh);
                    waterSystems.push(droplets);
                }
            }
        });

        if (waterSystems.length > 0) {
            this.activeEffects.set(effectId, waterSystems);
        }

        console.log(`Enhanced wet effect applied with ID: ${effectId}`);
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
     * Add realistic water droplets to a mesh
     * @param mesh The mesh to add droplets to
     * @returns The created particle system
     */
    private addWaterDroplets(mesh: AbstractMesh): ParticleSystem {
        // Create a sharp, clear water droplet texture
        const textureSize = 64; // Smaller for sharper details
        const dynamicTexture = new DynamicTexture("dropletTexture", textureSize, this.scene, true);
        const ctx = dynamicTexture.getContext();

        // Clear background to fully transparent
        ctx.clearRect(0, 0, textureSize, textureSize);

        const center = textureSize / 2;
        const radius = textureSize / 2.5;

        // Create a SOLID water droplet - not blurry
        // Main droplet body - solid blue circle
        ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'; // Solid blue, not gradient
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();

        // Add a white highlight for realism
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(center - radius * 0.3, center - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Add a smaller bright highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.beginPath();
        ctx.arc(center - radius * 0.2, center - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Add droplet outline for definition
        ctx.strokeStyle = 'rgba(50, 100, 200, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.stroke();

        dynamicTexture.update();

        // Create water droplet system with proper settings
        const droplets = new ParticleSystem("waterDroplets", 800, this.scene); // Reduced count for performance
        droplets.particleTexture = dynamicTexture;
        droplets.emitter = mesh;

        const bbox = mesh.getBoundingInfo().boundingBox;
        const meshSize = bbox.maximumWorld.subtract(bbox.minimumWorld);

        // Emit from surface of the mesh only
        droplets.minEmitBox = new Vector3(
            -meshSize.x * 0.3,  // Narrower area
            meshSize.y * 0.3,   // Start from upper surface
            -meshSize.z * 0.2   // Shallow depth
        );
        droplets.maxEmitBox = new Vector3(
            meshSize.x * 0.3,   // Narrower area
            meshSize.y * 0.6,   // Top surface
            meshSize.z * 0.2    // Shallow depth
        );

        // Clear, solid water colors - no transparency blur
        droplets.color1 = new Color4(0.4, 0.7, 1.0, 1.0);   // Solid blue droplets
        droplets.color2 = new Color4(0.2, 0.5, 0.9, 1.0);   // Solid darker blue
        droplets.colorDead = new Color4(0.6, 0.8, 1.0, 0);  // Fade out

        // Smaller, more realistic droplet sizes
        droplets.minSize = 0.008;  // Very small droplets
        droplets.maxSize = 0.02;   // Small to medium droplets

        // Shorter lifetime for realistic water behavior
        droplets.minLifeTime = 1.5;   // Quick droplets
        droplets.maxLifeTime = 3.0;   // Don't linger too long
        droplets.emitRate = 25;       // Moderate amount

        // Realistic water physics
        droplets.gravity = new Vector3(0, -0.2, 0);  // Strong gravity - water falls fast
        droplets.minEmitPower = 0.01;
        droplets.maxEmitPower = 0.03;

        // Straight down motion - like real water droplets
        droplets.direction1 = new Vector3(-0.05, -1.0, -0.02);  // Mostly straight down
        droplets.direction2 = new Vector3(0.05, -0.8, 0.02);    // Slight variation

        // Use STANDARD blending - not additive (additive makes it foggy)
        droplets.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        // NO size animation - keep droplets consistent size
        // Remove all the gradient animations that make it blurry
        droplets.renderingGroupId = 1;
        droplets.worldOffset = Vector3.Zero();
        droplets.start();

        return droplets;
    }

    // Alternative: Create water splash effect instead of mist
    private addWaterSplash(mesh: AbstractMesh): ParticleSystem {
        // Create small splash particle texture
        const textureSize = 32;
        const splashTexture = new DynamicTexture("waterSplash", textureSize, this.scene, true);
        const ctx = splashTexture.getContext();

        ctx.clearRect(0, 0, textureSize, textureSize);

        // Create small water splash dots
        const center = textureSize / 2;
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(center, center, center * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Add white center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(center, center, center * 0.4, 0, Math.PI * 2);
        ctx.fill();

        splashTexture.update();

        // Create splash system
        const splash = new ParticleSystem("waterSplash", 200, this.scene);
        splash.particleTexture = splashTexture;
        splash.emitter = mesh;

        const bbox = mesh.getBoundingInfo().boundingBox;
        const meshSize = bbox.maximumWorld.subtract(bbox.minimumWorld);

        // Emit from bottom of mesh (where droplets would hit)
        splash.minEmitBox = new Vector3(-meshSize.x * 0.2, -meshSize.y * 0.1, -meshSize.z * 0.1);
        splash.maxEmitBox = new Vector3(meshSize.x * 0.2, 0, meshSize.z * 0.1);

        splash.color1 = new Color4(0.7, 0.9, 1.0, 0.8);
        splash.color2 = new Color4(0.5, 0.8, 1.0, 0.6);
        splash.colorDead = new Color4(0.8, 0.95, 1.0, 0);

        splash.minSize = 0.003;
        splash.maxSize = 0.008;
        splash.minLifeTime = 0.5;
        splash.maxLifeTime = 1.2;
        splash.emitRate = 8;

        splash.gravity = new Vector3(0, -0.1, 0);
        splash.minEmitPower = 0.02;
        splash.maxEmitPower = 0.05;

        splash.direction1 = new Vector3(-0.2, 0.1, -0.1);
        splash.direction2 = new Vector3(0.2, 0.3, 0.1);

        splash.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        splash.start();

        return splash;
    }
    /**
 * Apply cold effect to all materials in a model
 * @param modelRoot The root TransformNode of the model
 * @param coldLevel How intense the cold effect should be (0-1)
 * @param addFrostParticles Whether to add frost/ice particle effects
 * @returns Identifier for the applied effect
 */
    applyColdEffect(modelRoot: TransformNode, coldLevel: number = 0.8, addFrostParticles: boolean = true): string {
        if (!modelRoot) {
            console.error("Invalid model root");
            return "";
        }

        const effectId = `cold_${modelRoot.name}_${Date.now()}`;
        const frostSystems: ParticleSystem[] = [];

        const meshes = modelRoot.getChildMeshes();
        console.log(`Applying cold effect to ${meshes.length} meshes in model ${modelRoot.name}`);

        meshes.forEach(mesh => {
            if (mesh.material) {
                this.makeCold(mesh.material, coldLevel);

                // Add frost particles if requested
                if (addFrostParticles && mesh.getBoundingInfo().boundingSphere.radius > 0.1) {
                    const frostParticles = this.addFrostParticles(mesh);
                    frostSystems.push(frostParticles);
                }
            }
        });

        if (frostSystems.length > 0) {
            this.activeEffects.set(effectId, frostSystems);
        }

        console.log(`Cold effect applied with ID: ${effectId}`);
        return effectId;
    }

    /**
     * Make a material look cold/frozen
     * @param material The material to modify
     * @param coldLevel How cold the material should appear (0-1)
     */
    private makeCold(material: Material, coldLevel: number = 0.8): void {
        if (material instanceof PBRMaterial) {
            const pbrMat = material as PBRMaterial;

            // // Add cool/bluish tint to the material
            // if (pbrMat.albedoColor) {
            //     const coolTint = new Color3(0.7, 0.85, 1.2); // Cool blue-white tint
            //     pbrMat.albedoColor = Color3.Lerp(pbrMat.albedoColor, coolTint, coldLevel * 0.4);
            // }

            // Make material more brittle/rough (cold stiffening effect)
            pbrMat.roughness = Math.min(1.0, pbrMat.roughness + (coldLevel * 0.3));

            // Reduce metallic properties (cold makes things less reflective)
            pbrMat.metallic = Math.max(0.0, pbrMat.metallic - (coldLevel * 0.1));

            // Add frost-like clear coat
            pbrMat.clearCoat.isEnabled = true;
            pbrMat.clearCoat.intensity = coldLevel * 0.6;
            pbrMat.clearCoat.roughness = 0.3; // Slightly rough for frost texture

            // Add subtle cold emission (very faint blue glow)
            pbrMat.emissiveColor = new Color3(
                coldLevel * 0.02, // Minimal red
                coldLevel * 0.05, // Slight green
                coldLevel * 0.10  // Blue glow
            );

        } else if (material instanceof StandardMaterial) {
            const stdMat = material as StandardMaterial;

            // Add cool tint
            // if (stdMat.diffuseColor) {
            //     const coolTint = new Color3(0.7, 0.85, 1.2);
            //     stdMat.diffuseColor = Color3.Lerp(stdMat.diffuseColor, coolTint, coldLevel * 0.4);
            // }

            // Add cold glow
            stdMat.emissiveColor = new Color3(
                coldLevel * 0.02,
                coldLevel * 0.05,
                coldLevel * 0.10
            );

            // Increase specular for icy effect
            stdMat.specularColor = Color3.Lerp(stdMat.specularColor, new Color3(0.8, 0.9, 1.0), coldLevel * 0.5);
            stdMat.specularPower = Math.min(128, stdMat.specularPower + (coldLevel * 64));
        }

        material.markAsDirty(Material.AllDirtyFlag);
    }

    /**
     * Add frost/ice particles around a mesh
     * @param mesh The mesh to add frost particles to
     * @returns The created particle system
     */
    private addFrostParticles(mesh: AbstractMesh): ParticleSystem {
        // Create frost particle texture
        const textureSize = 64;
        const frostTexture = new DynamicTexture("frostTexture", textureSize, this.scene, true);
        const ctx = frostTexture.getContext();

        // Clear background
        ctx.clearRect(0, 0, textureSize, textureSize);

        // Create frost crystal pattern
        const center = textureSize / 2;
        const maxRadius = textureSize / 2.5;

        // Main frost crystal (hexagonal-ish shape)
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
        gradient.addColorStop(0, 'rgba(240, 248, 255, 0.9)'); // Almost white
        gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.7)'); // Light blue
        gradient.addColorStop(0.7, 'rgba(180, 200, 255, 0.4)'); // Blue
        gradient.addColorStop(1, 'rgba(160, 180, 255, 0)'); // Transparent blue

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add crystal structure lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;

        // Draw frost crystal pattern (6-pointed star)
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x1 = center + Math.cos(angle) * (maxRadius * 0.3);
            const y1 = center + Math.sin(angle) * (maxRadius * 0.3);
            const x2 = center + Math.cos(angle) * (maxRadius * 0.8);
            const y2 = center + Math.sin(angle) * (maxRadius * 0.8);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Add small ice crystals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 8; i++) {
            const x = center + (Math.random() - 0.5) * textureSize * 0.6;
            const y = center + (Math.random() - 0.5) * textureSize * 0.6;
            const size = Math.random() * 2 + 1;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        frostTexture.update();

        // Create particle system for frost
        const frostParticles = new ParticleSystem("frostParticles", 1200, this.scene);
        frostParticles.particleTexture = frostTexture;
        frostParticles.emitter = mesh;

        const bbox = mesh.getBoundingInfo().boundingBox;
        const meshSize = bbox.maximumWorld.subtract(bbox.minimumWorld);

        // Emit from around the mesh surface
        frostParticles.minEmitBox = new Vector3(
            -meshSize.x * 0.5,  // Around the mesh
            -meshSize.y * 0.1,  // Slightly below
            -meshSize.z * 0.5   // All around
        );
        frostParticles.maxEmitBox = new Vector3(
            meshSize.x * 0.5,   // Around the mesh
            meshSize.y * 0.4,   // Up to mid-height
            meshSize.z * 0.5    // All around
        );

        // Frost colors - cool blues and whites
        frostParticles.color1 = new Color4(0.9, 0.95, 1.0, 0.8);   // Almost white
        frostParticles.color2 = new Color4(0.7, 0.85, 1.0, 0.6);   // Light blue
        frostParticles.colorDead = new Color4(0.8, 0.9, 1.0, 0);   // Fade to blue-white

        // Sizes for frost crystals
        frostParticles.minSize = 0.008;  // Small crystals
        frostParticles.maxSize = 0.025;  // Medium crystals

        // Frost behavior - slow settling and floating
        frostParticles.minLifeTime = 5.0;   // Long-lasting frost
        frostParticles.maxLifeTime = 10.0;  // Very persistent
        frostParticles.emitRate = 15;       // Moderate emission

        // Physics - frost settles slowly with some floating
        frostParticles.gravity = new Vector3(0, -0.02, 0);  // Very light gravity (frost is light)
        frostParticles.minEmitPower = 0.005; // Very slow movement
        frostParticles.maxEmitPower = 0.015; // Gentle floating

        // Direction - mostly floating with slight downward drift
        frostParticles.direction1 = new Vector3(-0.05, -0.2, -0.05);  // Slight downward
        frostParticles.direction2 = new Vector3(0.05, 0.1, 0.05);     // Some upward float

        // Special effects for frost
        frostParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        // Add size animation (frost crystals grow over time)
        frostParticles.addSizeGradient(0, 0.2);    // Start very small
        frostParticles.addSizeGradient(0.3, 0.8);  // Grow
        frostParticles.addSizeGradient(0.8, 1.0);  // Full size
        frostParticles.addSizeGradient(1.0, 0.9);  // Slightly shrink at end

        // Add velocity over lifetime (frost slows down as it settles)
        frostParticles.addVelocityGradient(0, 0.8);    // Start slower
        frostParticles.addVelocityGradient(0.5, 1.0);  // Peak movement
        frostParticles.addVelocityGradient(1.0, 0.3);  // Settle down

        frostParticles.worldOffset = Vector3.Zero();
        frostParticles.start();

        return frostParticles;
    }

    /**
     * Apply different cold intensities (convenience methods)
     */
    applyMildCold(modelRoot: TransformNode): string {
        return this.applyColdEffect(modelRoot, 0.4, true);
    }

    applyIntenseCold(modelRoot: TransformNode): string {
        return this.applyColdEffect(modelRoot, 1.0, true);
    }

    applyFreezingCold(modelRoot: TransformNode): string {
        return this.applyColdEffect(modelRoot, 1.2, true);
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
 * Apply hot air effect to all materials in a model
 * @param modelRoot The root TransformNode of the model
 * @param heatLevel How intense the heat effect should be (0-1)
 * @param addHeatWaves Whether to add rising heat particle effects
 * @returns Identifier for the applied effect
 */
    applyHotEffect(modelRoot: TransformNode, heatLevel: number = 0.8, addHeatWaves: boolean = true): string {
        if (!modelRoot) {
            console.error("Invalid model root");
            return "";
        }

        const effectId = `hot_${modelRoot.name}_${Date.now()}`;
        const heatSystems: ParticleSystem[] = [];

        const meshes = modelRoot.getChildMeshes();
        console.log(`Applying hot effect to ${meshes.length} meshes in model ${modelRoot.name}`);

        meshes.forEach(mesh => {
            if (mesh.material) {
                this.makeHot(mesh.material, heatLevel);

                // Add heat waves if requested
                if (addHeatWaves && mesh.getBoundingInfo().boundingSphere.radius > 0.1) {
                    const heatWaves = this.addHeatWaves(mesh);
                    heatSystems.push(heatWaves);
                }
            }
        });

        if (heatSystems.length > 0) {
            this.activeEffects.set(effectId, heatSystems);
        }

        console.log(`Hot effect applied with ID: ${effectId}`);
        return effectId;
    }

    /**
 * Make a material look hot/heated
 * @param material The material to modify
 * @param heatLevel How hot the material should appear (0-1)
 */
    private makeHot(material: Material, heatLevel: number = 0.8): void {
        if (material instanceof PBRMaterial) {
            const pbrMat = material as PBRMaterial;

            // Add warm/reddish tint to the material
            if (pbrMat.albedoColor) {
                const warmTint = new Color3(1.2, 0.8, 0.6); // Warm orange-red tint
                // pbrMat.albedoColor = Color3.Lerp(pbrMat.albedoColor, warmTint, heatLevel * 0.3);
            }

            // Make material slightly more rough (heat damage effect)
            pbrMat.roughness = Math.min(1.0, pbrMat.roughness + (heatLevel * 0.2));

            // Add subtle glow/emission for heat effect
            pbrMat.emissiveColor = new Color3(
                heatLevel * 0.15, // Red glow
                heatLevel * 0.08, // Orange glow
                heatLevel * 0.02  // Minimal blue
            );

            // Disable clear coat (heat would damage any coating)
            pbrMat.clearCoat.isEnabled = false;

        } else if (material instanceof StandardMaterial) {
            const stdMat = material as StandardMaterial;

            // Add warm tint
            if (stdMat.diffuseColor) {
                const warmTint = new Color3(1.2, 0.8, 0.6);
                // stdMat.diffuseColor = Color3.Lerp(stdMat.diffuseColor, warmTint, heatLevel * 0.3);
            }

            // Add heat glow
            stdMat.emissiveColor = new Color3(
                heatLevel * 0.15,
                heatLevel * 0.08,
                heatLevel * 0.02
            );

            // Reduce specular for heat-damaged look
            stdMat.specularPower = Math.max(16, stdMat.specularPower - (heatLevel * 32));
        }

        material.markAsDirty(Material.AllDirtyFlag);
    }


    /**
     * Add rising heat wave particles around a mesh
     * @param mesh The mesh to add heat waves to
     * @returns The created particle system
     */
    private addHeatWaves(mesh: AbstractMesh): ParticleSystem {
        // Create heat wave texture
        const textureSize = 128;
        const heatTexture = new DynamicTexture("heatWaveTexture", textureSize, this.scene, true);
        const ctx = heatTexture.getContext();

        // Clear background
        ctx.clearRect(0, 0, textureSize, textureSize);

        // Create heat distortion pattern
        const centerX = textureSize / 2;
        const centerY = textureSize / 2;
        const maxRadius = textureSize / 2.2;

        // Create radial heat wave pattern
        for (let radius = 10; radius < maxRadius; radius += 8) {
            const alpha = 1 - (radius / maxRadius);
            const gradient = ctx.createRadialGradient(centerX, centerY, radius - 4, centerX, centerY, radius);

            gradient.addColorStop(0, `rgba(255, 150, 100, ${alpha * 0.3})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 150, ${alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(255, 220, 180, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add some shimmer effects
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * textureSize;
            const y = Math.random() * textureSize;
            const size = Math.random() * 8 + 2;

            ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, 100, 0.6)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        heatTexture.update();

        // Create particle system for heat waves
        const heatWaves = new ParticleSystem("heatWaves", 1500, this.scene);
        heatWaves.particleTexture = heatTexture;
        heatWaves.emitter = mesh;

        const bbox = mesh.getBoundingInfo().boundingBox;
        const meshSize = bbox.maximumWorld.subtract(bbox.minimumWorld);

        // Emit from around the entire mesh
        heatWaves.minEmitBox = new Vector3(
            -meshSize.x * 0.6,  // Wide area around mesh
            -meshSize.y * 0.1,  // Start slightly below
            -meshSize.z * 0.6   // All around
        );
        heatWaves.maxEmitBox = new Vector3(
            meshSize.x * 0.6,   // Wide area around mesh
            meshSize.y * 0.2,   // Up to lower part
            meshSize.z * 0.6    // All around
        );

        // Heat wave colors - warm oranges and reds
        heatWaves.color1 = new Color4(1.0, 0.7, 0.3, 0.6);   // Orange
        heatWaves.color2 = new Color4(1.0, 0.5, 0.2, 0.4);   // Red-orange
        heatWaves.colorDead = new Color4(1.0, 0.8, 0.6, 0);  // Fade to warm white

        // Sizes for heat distortion effect
        heatWaves.minSize = 0.05;  // Start small
        heatWaves.maxSize = 0.15;  // Grow as they rise

        // Heat wave behavior - slow rising with long lifetime
        heatWaves.minLifeTime = 4.0;   // Long-lasting heat waves
        heatWaves.maxLifeTime = 8.0;   // Very persistent
        heatWaves.emitRate = 20;       // Moderate emission

        // Physics - rising hot air
        heatWaves.gravity = new Vector3(0, 0.05, 0);  // Slight upward force (hot air rises)
        heatWaves.minEmitPower = 0.02; // Slow initial movement
        heatWaves.maxEmitPower = 0.04; // Gentle movement

        // Direction - mostly upward with slight randomness
        heatWaves.direction1 = new Vector3(-0.1, 0.8, -0.1);  // Mostly up
        heatWaves.direction2 = new Vector3(0.1, 1.2, 0.1);    // Strongly upward

        // Special effects for heat waves
        heatWaves.blendMode = ParticleSystem.BLENDMODE_STANDARD;

        // Add size animation over lifetime (heat waves expand as they rise)
        heatWaves.addSizeGradient(0, 0.3);    // Start at 30% size
        heatWaves.addSizeGradient(0.5, 0.8);  // Grow to 80% at halfway
        heatWaves.addSizeGradient(1.0, 1.2);  // End at 120% size

        // Add velocity over lifetime (slow down as they rise)
        heatWaves.addVelocityGradient(0, 1.0);    // Full speed initially
        heatWaves.addVelocityGradient(0.7, 0.5);  // Slow down
        heatWaves.addVelocityGradient(1.0, 0.2);  // Very slow at end

        heatWaves.worldOffset = Vector3.Zero();
        heatWaves.start();

        return heatWaves;
    }

    /**
     * Apply different heat intensities (convenience methods)
     */
    applyMildHeat(modelRoot: TransformNode): string {
        return this.applyHotEffect(modelRoot, 0.4, true);
    }

    applyIntenseHeat(modelRoot: TransformNode): string {
        return this.applyHotEffect(modelRoot, 1.0, true);
    }

    applyScorchingHeat(modelRoot: TransformNode): string {
        return this.applyHotEffect(modelRoot, 1.2, true);
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