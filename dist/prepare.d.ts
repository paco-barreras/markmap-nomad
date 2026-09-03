import { type IAssets, type IPureNode } from 'markmap-common';
import { Transformer } from 'markmap-lib';
import type { ResolvedMindMapSettings } from './types';
export interface PreparedMindMap {
    title: string;
    root: IPureNode;
    config: ResolvedMindMapSettings;
    assets?: IAssets;
}
export declare function depthColorAt(config: ResolvedMindMapSettings, depth: number): import("./types").MindMapDepthColor;
export declare function prepareYamlMindMap(yaml: string): PreparedMindMap;
export declare function prepareMarkdownWithTransformer(markdown: string, transformer: Transformer): PreparedMindMap;
