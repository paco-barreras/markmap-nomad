import { parse } from 'yaml';
import {
  deriveOptions,
  type IMarkmapJSONOptions,
  type IMarkmapOptions,
} from 'markmap-view';
import type {
  MindMapCategory,
  MindMapDepthColor,
  MindMapNode,
  MindMapViewerConfig,
  ResolvedMindMapDocument,
  ResolvedMindMapSettings,
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
  color: '#a6a6a6',
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
type ViewerKey = keyof Required<MindMapViewerConfig>;

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
  assertKeys(value, new Set(['label', 'color', 'fill']), `categories.${key}`);
  if (typeof value.label !== 'string' || !value.label.trim()) {
    throw new Error(`categories.${key}.label must be a non-empty string`);
  }
  return {
    label: value.label.trim(),
    color: parseColor(value.color, `categories.${key}.color`),
    fill: parseColor(value.fill, `categories.${key}.fill`),
  };
}

function parseColor(value: unknown, at: string) {
  if (
    typeof value !== 'string' ||
    !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  ) {
    throw new Error(`${at} must be a 3- or 6-digit hex color`);
  }
  return value;
}

function parseCategories(value: unknown): Record<string, MindMapCategory> {
  const categories: Record<string, MindMapCategory> = {};
  if (value !== undefined) {
    if (!isRecord(value)) throw new Error('categories must be an object');
    Object.entries(value).forEach(([key, category]) => {
      categories[key] = parseCategory(key, category);
    });
  }
  categories.unassigned ||= { ...defaultUnassigned };
  return categories;
}

function parseDepthColors(value: unknown): MindMapDepthColor[] {
  if (!Array.isArray(value) || !value.length) {
    throw new Error('depthColors must be a non-empty array');
  }
  return value.map((item, index) => {
    if (!isRecord(item))
      throw new Error(`depthColors[${index}] must be an object`);
    assertKeys(item, new Set(['fill', 'accent']), `depthColors[${index}]`);
    return {
      fill: parseColor(item.fill, `depthColors[${index}].fill`),
      accent: parseColor(item.accent, `depthColors[${index}].accent`),
    };
  });
}

function resolveDepthColors(value: unknown) {
  return value === undefined
    ? defaultDepthColors.map((color) => ({ ...color }))
    : parseDepthColors(value);
}

function parseColorMode(value: unknown, at = 'colorBy') {
  if (value === undefined || value === 'depth') return 'depth';
  if (value === 'category') return 'category';
  throw new Error(`${at} must be depth or category`);
}

function pickViewerOptions(options: Partial<IMarkmapOptions>) {
  const viewer: MindMapViewerConfig = {};
  Object.keys(defaultViewer).forEach((key) => {
    const viewerKey = key as ViewerKey;
    if (options[viewerKey] !== undefined) {
      Object.assign(viewer, { [viewerKey]: options[viewerKey] });
    }
  });
  return viewer;
}

function parseViewerOptions(value: unknown): MindMapViewerConfig {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error('viewer must be an object');
  assertKeys(value, viewerKeys, 'viewer');
  Object.entries(value).forEach(([key, option]) => {
    const expected = defaultViewer[key as ViewerKey];
    if (
      typeof option !== typeof expected ||
      (typeof option === 'number' && !Number.isFinite(option))
    ) {
      throw new Error(`viewer.${key} must be a ${typeof expected}`);
    }
  });
  return value as MindMapViewerConfig;
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
  const category = value.category;
  if (category !== undefined) {
    if (typeof category !== 'string' || !categories[category]) {
      throw new Error(
        `${at}.category references an unknown category: ${category}`,
      );
    }
  }
  if (value.children !== undefined && !Array.isArray(value.children)) {
    throw new Error(`${at}.children must be an array`);
  }
  return {
    label: value.label.trim(),
    category,
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

  const categories = parseCategories(raw.categories);

  const viewer = parseViewerOptions(raw.viewer);

  if (raw.tree === undefined) throw new Error('tree is required');
  const tree = parseNode(raw.tree, categories, 'tree');

  return {
    title:
      typeof raw.title === 'string' && raw.title.trim()
        ? raw.title.trim()
        : tree.label,
    colorBy: parseColorMode(raw.colorBy),
    depthColors: resolveDepthColors(raw.depthColors),
    categories,
    viewer: { ...defaultViewer, ...viewer },
    tree,
  };
}

export function parseMarkdownMindMapConfig(
  frontmatter: unknown,
  fallbackTitle: string,
): ResolvedMindMapSettings {
  const root = isRecord(frontmatter) ? frontmatter : {};
  const markmap = isRecord(root.markmap) ? root.markmap : {};
  const categories = parseCategories(markmap.categories);

  const viewer = pickViewerOptions(
    deriveOptions(markmap as Partial<IMarkmapJSONOptions>),
  );

  return {
    title:
      typeof root.title === 'string' && root.title.trim()
        ? root.title.trim()
        : fallbackTitle,
    colorBy: parseColorMode(markmap.colorBy, 'markmap.colorBy'),
    depthColors: resolveDepthColors(markmap.depthColors),
    categories,
    viewer: { ...defaultViewer, ...viewer },
  };
}
