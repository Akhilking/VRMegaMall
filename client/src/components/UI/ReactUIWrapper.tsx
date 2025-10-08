import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ProductReviewPanel } from './ProductReviewPanel';
import { MainProductLayout } from './MainProductLayout';
import { MallComponent } from '../MallComponent';
import { PauseCircle, PlayCircle } from '@mui/icons-material';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

export class ReactUIWrapper {
    private container: HTMLElement;
    private root: any;
    private mallComponent: MallComponent;
    private currentEffect: string = 'original';
    private canvasElement: HTMLCanvasElement | null = null;

    constructor(mallComponent: MallComponent) {
        this.mallComponent = mallComponent;
        this.createContainer();
        this.saveCanvasReference();
        this.mountReactApp();
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'react-ui-root';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '10';
        document.body.appendChild(this.container);
    }

    private saveCanvasReference(): void {
        // Save a reference to the Babylon canvas
        this.canvasElement = document.getElementById('renderCanvas') as HTMLCanvasElement;
    }

    private mountReactApp(): void {
        if (!this.mallComponent) {
            console.error("MallComponent is null or undefined!");
            return;
        }
        
        const handleEffectChange = async (effect: string) => {
            try {
                if (!this.mallComponent) {
                    console.error("MallComponent is not available");
                    return;
                }
                const currentState = this.mallComponent.getCurrentState();
                if (currentState === 'transitioning') {
                    console.log("Already transitioning, please wait...");
                    return;
                }

                if (effect === 'wet' && currentState === 'wet') {
                    console.log("Wet effect is already applied");
                    return;
                }

                if (effect === 'original' && currentState === 'original') {
                    console.log("Already in original state");
                    return;
                }
                if (effect === 'hot' && currentState === 'hot') {
                    console.log("Hot effect is already applied");
                    return;
                }

                switch (effect) {
                    case 'wet':
                        await this.mallComponent.applyWetEffectTransition();
                        this.currentEffect = 'wet';
                        break;
                    case 'hot':
                        await this.mallComponent.applyHotEffectTransition();
                        this.currentEffect = 'hot';
                        break;
                    case 'cold':
                        await this.mallComponent.applyColdEffectTransition();
                        this.currentEffect = 'cold';
                        break;
                    case 'original':
                        await this.mallComponent.removeAllEffect();
                        this.currentEffect = 'original';
                        break;
                    default:
                        console.warn(`Unknown effect: ${effect}`);
                }
            }
            catch (error) {
                console.error("Error applying effect:", error);
            }
        };

        // Main App component with integrated layout
        const App = () => {
            // Add useEffect to move the canvas to the 3D container after rendering
            useEffect(() => {
                // Check if the mall component is loaded and ready
                if (!this.mallComponent) {
                    console.error("MallComponent is not ready!");
                    return;
                }

                // Wait for the DOM to be ready
                setTimeout(() => {
                    const canvas = document.getElementById('renderCanvas');
                    const container = document.querySelector('[data-testid="3d-view-container"]');

                    if (canvas && container) {
                        canvas.style.width = '100%';
                        canvas.style.height = '100%';
                        canvas.style.position = 'absolute';
                        canvas.style.top = '0';
                        canvas.style.left = '0';
                        canvas.style.outline = 'none';
                        canvas.style.margin = '0';
                        canvas.style.padding = '0';
                        container.appendChild(canvas);
                        console.log("Canvas successfully moved to React container");
                    }
                }, 200); // Give a bit more time for React rendering
            }, []);

            return (
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <MainProductLayout mallComponent={this.mallComponent} />
                    {/* <ProductReviewPanel onEffectChange={handleEffectChange} /> */}
                </ThemeProvider>
            );
        };

        this.root = ReactDOM.createRoot(this.container);
        this.root.render(<App />);
    }

    public show(): void {
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    // Add cleanup in a dispose method:
    public dispose(): void {
        // Clean up other resources
        if (this.root) {
            this.root.unmount();
        }
    }
    public destroy(): void {
        // Return the canvas to its original container before unmounting
        const canvas = this.canvasElement;
        if (canvas && canvas.parentNode) {
            document.body.appendChild(canvas);
        }

        if (this.root) {
            this.root.unmount();
        }
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}