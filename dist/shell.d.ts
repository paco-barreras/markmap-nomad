import type { MindMapCategory } from './types';
export interface MindMapShell {
    svg: SVGElement;
    searchInput: HTMLInputElement;
    colorInput: HTMLInputElement;
}
export declare function resolveTarget(target: string | HTMLElement): HTMLElement;
export declare function renderShell(target: HTMLElement, title: string, categories: Record<string, MindMapCategory>): MindMapShell;
