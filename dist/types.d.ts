export type ColorMode = 'depth' | 'category';
export interface MindMapDepthColor {
    fill: string;
    accent: string;
}
export interface MindMapCategory {
    label: string;
    color: string;
    fill: string;
}
export interface MindMapNode {
    label: string;
    category?: string;
    children?: MindMapNode[];
}
export interface MindMapViewerConfig {
    duration?: number;
    fitRatio?: number;
    initialExpandLevel?: number;
    maxInitialScale?: number;
    maxWidth?: number;
    pan?: boolean;
    spacingHorizontal?: number;
    spacingVertical?: number;
    zoom?: boolean;
}
export interface MindMapDocument {
    title?: string;
    colorBy?: ColorMode;
    depthColors?: MindMapDepthColor[];
    categories?: Record<string, MindMapCategory>;
    viewer?: MindMapViewerConfig;
    tree: MindMapNode;
}
export interface ResolvedMindMapSettings {
    title: string;
    colorBy: ColorMode;
    depthColors: MindMapDepthColor[];
    categories: Record<string, MindMapCategory>;
    viewer: Required<MindMapViewerConfig>;
}
export interface ResolvedMindMapDocument extends ResolvedMindMapSettings {
    tree: MindMapNode;
}
export type MindMapSource = {
    markdown: string;
    yaml?: never;
} | {
    markdown?: never;
    yaml: string;
};
export type CreateMindMapOptions = MindMapSource & {
    target: string | HTMLElement;
};
export interface MindMapController {
    getColorMode(): ColorMode;
    setColorMode(mode: ColorMode): Promise<void>;
    expandAll(): Promise<void>;
    collapseAll(): Promise<void>;
    fit(): Promise<void>;
    search(query: string): number;
    clearSelection(): Promise<void>;
    destroy(): void;
}
