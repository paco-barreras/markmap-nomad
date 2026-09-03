import { escapeHtml, type IAssets, type IPureNode } from 'markmap-common';
import { Transformer } from 'markmap-lib';
import { parseMarkdownMindMapConfig, parseMindMapYaml } from './config';
import type { MindMapNode, ResolvedMindMapSettings } from './types';

export interface PreparedMindMap {
  title: string;
  root: IPureNode;
  config: ResolvedMindMapSettings;
  assets?: IAssets;
}

export function depthColorAt(config: ResolvedMindMapSettings, depth: number) {
  return config.depthColors[
    Math.min(Math.max(depth, 0), config.depthColors.length - 1)
  ];
}

function renderCard(
  content: string,
  id: string,
  categoryKey: string,
  depth: number,
  config: ResolvedMindMapSettings,
) {
  const category = config.categories[categoryKey];
  const depthColor = depthColorAt(config, depth);
  const levelClass =
    depth === 0 ? ' nomad-card-root' : depth === 1 ? ' nomad-card-primary' : '';
  const style = [
    `--category-color:${category.color}`,
    `--category-fill:${category.fill}`,
    `--depth-fill:${depthColor.fill}`,
  ].join(';');
  return `<div class="nomad-card${levelClass}" data-node-id="${escapeHtml(id)}" data-category="${escapeHtml(categoryKey)}" style="${style}" tabindex="0"><span>${content}</span></div>`;
}

export function prepareYamlMindMap(yaml: string): PreparedMindMap {
  const config = parseMindMapYaml(yaml);

  const convertNode = (
    source: MindMapNode,
    depth: number,
    inheritedCategory: string,
    indexPath: number[],
  ): IPureNode => {
    const category = source.category || inheritedCategory;
    const id = indexPath.join('.');

    return {
      content: renderCard(
        escapeHtml(source.label),
        id,
        category,
        depth,
        config,
      ),
      payload: {
        id,
        label: source.label,
        category,
      },
      children: (source.children || []).map((child, index) =>
        convertNode(child, depth + 1, category, [...indexPath, index]),
      ),
    };
  };

  return {
    title: config.title,
    root: convertNode(config.tree, 0, 'unassigned', [0]),
    config,
  };
}

const categoryTagPattern = /(?:^|\s)#cat\/([a-z][a-z0-9_-]*)\s*$/;

function extractCategoryTag(content: string) {
  const match = categoryTagPattern.exec(content);
  return {
    content: match ? content.slice(0, match.index).trimEnd() : content,
    category: match?.[1],
  };
}

function plainText(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.textContent?.trim() || '';
}

function decorateMarkdownTree(
  source: IPureNode,
  config: ResolvedMindMapSettings,
  depth: number,
  inheritedCategory: string,
  indexPath: number[],
): IPureNode {
  const { content, category: explicitCategory } = extractCategoryTag(
    source.content,
  );
  if (explicitCategory && !config.categories[explicitCategory]) {
    throw new Error(`Unknown category tag: #cat/${explicitCategory}`);
  }
  const category = explicitCategory || inheritedCategory;
  const label = plainText(content);
  if (!label) throw new Error('Every mind map node must contain text');

  const id = indexPath.join('.');
  return {
    content: renderCard(content, id, category, depth, config),
    payload: {
      ...source.payload,
      id,
      label,
      category,
    },
    children: source.children.map((child, index) =>
      decorateMarkdownTree(child, config, depth + 1, category, [
        ...indexPath,
        index,
      ]),
    ),
  };
}

export function prepareMarkdownWithTransformer(
  markdown: string,
  transformer: Transformer,
): PreparedMindMap {
  if (!markdown.trim()) throw new Error('Markdown input is empty');
  const {
    root: transformedRoot,
    frontmatter,
    features,
  } = transformer.transform(markdown);
  const rootLabel = plainText(
    extractCategoryTag(transformedRoot.content).content,
  );
  if (!rootLabel) throw new Error('Markdown must contain a root node');
  const config = parseMarkdownMindMapConfig(frontmatter, rootLabel);
  const root = decorateMarkdownTree(transformedRoot, config, 0, 'unassigned', [
    0,
  ]);
  return {
    title: config.title,
    root,
    config,
    assets: transformer.getUsedAssets(features),
  };
}
