import type { IPureNode } from 'markmap-common';
import type { IMarkmapOptions, Markmap } from 'markmap-view';

export type ColorMode = 'depth' | 'category';

export interface MindMapDepthColor {
  fill: string;
  accent: string;
}

export interface MindMapCategory {
  label: string;
  stripe: string;
  fill: string;
}

export interface MindMapNode {
  label: string;
  category?: string;
  children?: MindMapNode[];
}

export type MindMapViewerConfig = Partial<
  Pick<
    IMarkmapOptions,
    | 'duration'
    | 'fitRatio'
    | 'initialExpandLevel'
    | 'maxInitialScale'
    | 'maxWidth'
    | 'pan'
    | 'spacingHorizontal'
    | 'spacingVertical'
    | 'zoom'
  >
>;

export interface MindMapDocument {
  title?: string;
  colorBy?: ColorMode;
  depthColors?: MindMapDepthColor[];
  categories?: Record<string, MindMapCategory>;
  viewer?: MindMapViewerConfig;
  tree: MindMapNode;
}

export interface ResolvedMindMapDocument {
  title: string;
  colorBy: ColorMode;
  depthColors: MindMapDepthColor[];
  categories: Record<string, MindMapCategory>;
  viewer: Required<MindMapViewerConfig>;
  tree: MindMapNode;
}

export interface CreateMindMapOptions {
  target: string | HTMLElement;
  yaml: string;
}

export interface PreparedMindMap {
  title: string;
  root: IPureNode;
  config: ResolvedMindMapDocument;
}

export interface MindMapController {
  readonly viewer: Markmap;
  getColorMode(): ColorMode;
  setColorMode(mode: ColorMode): void;
  expandAll(): Promise<void>;
  collapseAll(): Promise<void>;
  fit(): Promise<void>;
  search(query: string): number;
  clearSelection(): Promise<void>;
  destroy(): void;
}
