import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ProductReviewPanel } from './ProductReviewPanel';
import { MallComponent } from '../MallComponent';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

const App = React.createElement(
    ThemeProvider,
    { theme },
    React.createElement(CssBaseline),
    React.createElement(ProductReviewPanel)
);

export class ReactUIWrapper {
    private container: HTMLElement;
    private root: any;
    private mallComponent: MallComponent;
    private currentEffect : string = 'original';

    constructor(mallComponent: MallComponent) {
        this.mallComponent = mallComponent;
        this.createContainer();
        this.mountReactApp();
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'react-ui-root';
        document.body.appendChild(this.container);
    }

    private mountReactApp(): void {
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
                if(effect === 'hot' && currentState === 'hot'){
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
        }

        const App = React.createElement(
            ThemeProvider,
            { theme },
            React.createElement(CssBaseline),
            React.createElement(ProductReviewPanel, { onEffectChange: handleEffectChange })
        );
        this.root = ReactDOM.createRoot(this.container);
        this.root.render(App);

    }

    public show(): void {
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    public destroy(): void {
        if (this.root) {
            this.root.unmount();
        }
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}