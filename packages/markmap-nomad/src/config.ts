import { parse } from 'yaml';
import type {
  MindMapCategory,
  MindMapDepthColor,
  MindMapNode,
  MindMapViewerConfig,
  ResolvedMindMapDocument,
} from './types';

const defaultDepthColors: MindMapDepthColor[] = [
  { fill: '#c3caff', accent: '#7787ff' },
  { fill: '#bad3ee', accent: '#5c91c9' },
  { fill: '#a2dcd0', accent: '#5c9c8f' },
  { fill: '#9decbb', accent: '#789b89' },
  { fill: '#cdfea5', accent: '#789b89' },
];

const defaultUnassigned: MindMapCategory = {
  label: 'Unassigned',
  stripe: '#a6a6a6',
  fill: '#d9d9d9',
};

const defaultViewer: Required<MindMapViewerConfig> = {
  duration: 500,
  fitRatio: 0.88,
  initialExpandLevel: 2,
  maxInitialScale: 1,
  maxWidth: 260,
  pan: false,
  spacingHorizontal: 60,
  spacingVertical: 12,
  zoom: true,
};

const topLevelKeys = new Set([
  'title',
  'colorBy',
  'depthColors',
  'categories',
  'viewer',
  'tree',
]);
const viewerKeys = new Set(Object.keys(defaultViewer));
const nodeKeys = new Set(['label', 'category', 'children']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  at: string,
) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length)
    throw new Error(`Unknown ${at} field: ${unknown.join(', ')}`);
}

function parseCategory(key: string, value: unknown): MindMapCategory {
  if (!/^[a-z][a-z0-9_-]*$/.test(key)) {
    throw new Error(`Invalid category key: ${key}`);
  }
  if (!isRecord(value)) throw new Error(`Category ${key} must be an object`);
  assertKeys(value, new Set(['label', 'stripe', 'fill']), `categories.${key}`);
  for (const field of ['label', 'stripe', 'fill'] as const) {
    if (typeof value[field] !== 'string' || !value[field]) {
      throw new Error(`categories.${key}.${field} must be a string`);
    }
  }
  return value as unknown as MindMapCategory;
}

function parseDepthColors(value: unknown): MindMapDepthColor[] {
  if (!Array.isArray(value) || !value.length) {
    throw new Error('depthColors must be a non-empty array');
  }
  return value.map((item, index) => {
    if (!isRecord(item))
      throw new Error(`depthColors[${index}] must be an object`);
    assertKeys(item, new Set(['fill', 'accent']), `depthColors[${index}]`);
    if (typeof item.fill !== 'string' || typeof item.accent !== 'string') {
      throw new Error(`depthColors[${index}] requires fill and accent strings`);
    }
    return { fill: item.fill, accent: item.accent };
  });
}

function parseNode(
  value: unknown,
  categories: Record<string, MindMapCategory>,
  at: string,
): MindMapNode {
  if (!isRecord(value)) throw new Error(`${at} must be an object`);
  assertKeys(value, nodeKeys, at);
  if (typeof value.label !== 'string' || !value.label.trim()) {
    throw new Error(`${at}.label must be a non-empty string`);
  }
  if (value.category !== undefined) {
    if (typeof value.category !== 'string' || !categories[value.category]) {
      throw new Error(
        `${at}.category references an unknown category: ${value.category}`,
      );
    }
  }
  if (value.children !== undefined && !Array.isArray(value.children)) {
    throw new Error(`${at}.children must be an array`);
  }
  return {
    label: value.label.trim(),
    category: value.category as string | undefined,
    children: (value.children || []).map((child, index) =>
      parseNode(child, categories, `${at}.children[${index}]`),
    ),
  };
}

export function parseMindMapYaml(input: string): ResolvedMindMapDocument {
  if (!input.trim()) throw new Error('YAML input is empty');
  const raw: unknown = parse(input);
  if (!isRecord(raw)) throw new Error('Mind map YAML must be an object');
  assertKeys(raw, topLevelKeys, 'top-level');

  if (
    raw.colorBy !== undefined &&
    raw.colorBy !== 'depth' &&
    raw.colorBy !== 'category'
  ) {
    throw new Error('colorBy must be depth or category');
  }

  const categories: Record<string, MindMapCategory> = {};
  if (raw.categories !== undefined) {
    if (!isRecord(raw.categories))
      throw new Error('categories must be an object');
    Object.entries(raw.categories).forEach(([key, value]) => {
      if (key !== 'unassigned') categories[key] = parseCategory(key, value);
    });
    if (raw.categories.unassigned !== undefined) {
      categories.unassigned = parseCategory(
        'unassigned',
        raw.categories.unassigned,
      );
    }
  }
  categories.unassigned ||= defaultUnassigned;

  let viewer: MindMapViewerConfig = {};
  if (raw.viewer !== undefined) {
    if (!isRecord(raw.viewer)) throw new Error('viewer must be an object');
    assertKeys(raw.viewer, viewerKeys, 'viewer');
    viewer = raw.viewer as MindMapViewerConfig;
  }

  if (raw.tree === undefined) throw new Error('tree is required');
  const tree = parseNode(raw.tree, categories, 'tree');

  return {
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : tree.label,
    colorBy: raw.colorBy === 'category' ? 'category' : 'depth',
    depthColors:
      raw.depthColors === undefined
        ? defaultDepthColors.map((color) => ({ ...color }))
        : parseDepthColors(raw.depthColors),
    categories,
    viewer: { ...defaultViewer, ...viewer },
    tree,
  };
}
