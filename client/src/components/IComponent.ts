import { Scene } from "@babylonjs/core";

export interface IComponent {
    initialize(): void;
    update(): void;
}