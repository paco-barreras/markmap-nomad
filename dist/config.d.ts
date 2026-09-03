import type { ResolvedMindMapDocument, ResolvedMindMapSettings } from './types';
export declare function parseMindMapYaml(input: string): ResolvedMindMapDocument;
export declare function parseMarkdownMindMapConfig(frontmatter: unknown, fallbackTitle: string): ResolvedMindMapSettings;
