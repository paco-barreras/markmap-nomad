import type { INode, IPureNode } from 'markmap-common';
import { Markmap } from 'markmap-view';
import { parseMindMapYaml } from './config';
import type {
  ColorMode,
  CreateMindMapOptions,
  MindMapCategory,
  MindMapController,
  MindMapNode,
  PreparedMindMap,
} from './types';

const pathSeparator = ' > ';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character]!,
  );
}

export function prepareMindMap(yaml: string): PreparedMindMap {
  const config = parseMindMapYaml(yaml);
  const seenPaths = new Set<string>();

  const convertNode = (
    source: MindMapNode,
    depth: number,
    parentPath: string[],
    inheritedCategory: string,
  ): IPureNode => {
    const pathParts = depth ? [...parentPath, source.label] : [];
    const path = pathParts.join(pathSeparator);
    const normalizedPath = path.toLocaleLowerCase();
    if (normalizedPath) {
      if (seenPaths.has(normalizedPath))
        throw new Error(`Duplicate node path: ${path}`);
      seenPaths.add(normalizedPath);
    }
    const category = source.category || inheritedCategory;
    const id = path || '$root';
    const depthClass = Math.min(depth, config.depthColors.length - 1);
    const label = escapeHtml(source.label);

    return {
      content: `<div class="nomad-card depth-${depthClass}" data-node-id="${escapeHtml(id)}" data-category="${escapeHtml(category)}" tabindex="0"><span>${label}</span></div>`,
      payload: {
        id,
        label: source.label,
        path,
        category,
      },
      children: (source.children || []).map((child) =>
        convertNode(child, depth + 1, pathParts, category),
      ),
    };
  };

  const root = convertNode(config.tree, 0, [], 'unassigned');

  return {
    title: config.title,
    root,
    config,
  };
}

function requiredElement<ElementType extends Element>(
  parent: ParentNode,
  selector: string,
): ElementType {
  const element = parent.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Missing mind map element: ${selector}`);
  return element;
}

function visitRuntime(node: INode, callback: (node: INode) => void) {
  callback(node);
  node.children.forEach((child) => visitRuntime(child, callback));
}

function resolveTarget(target: string | HTMLElement) {
  const element =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;
  if (!element) throw new Error(`Mind map target not found: ${target}`);
  return element;
}

function renderShell(target: HTMLElement, title: string) {
  target.classList.add('markmap-nomad-host');
  target.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <h1 data-role="title"></h1>
        <div class="topbar-actions">
          <label class="search-control">
            <span class="visually-hidden">Find a visible node</span>
            <input data-role="search" type="search" placeholder="Find a node" autocomplete="off" />
          </label>
          <button data-role="expand-all" class="command-button" type="button">Expand all</button>
          <button data-role="collapse-all" class="command-button" type="button">Collapse</button>
        </div>
      </header>
      <main class="map-stage">
        <svg data-role="canvas" role="tree"></svg>
        <div class="map-key">
          <div class="legend" data-role="legend" aria-label="Content categories"></div>
          <label class="color-mode-toggle">
            <input data-role="color-mode" type="checkbox" />
            <span>Color by category</span>
          </label>
        </div>
        <div class="map-controls" role="toolbar" aria-label="Map controls">
          <button data-role="zoom-out" type="button" aria-label="Zoom out" title="Zoom out">&minus;</button>
          <button data-role="fit" class="fit-button" type="button" aria-label="Fit map" title="Fit map">Fit</button>
          <button data-role="zoom-in" type="button" aria-label="Zoom in" title="Zoom in">+</button>
        </div>
      </main>
    </div>`;
  requiredElement<HTMLElement>(target, '[data-role="title"]').textContent =
    title;
  const svg = requiredElement<SVGElement>(target, '[data-role="canvas"]');
  svg.setAttribute('aria-label', `${title} mind map`);
}

function renderLegend(
  target: HTMLElement,
  categories: Record<string, MindMapCategory>,
) {
  const legend = requiredElement<HTMLElement>(target, '[data-role="legend"]');
  legend.replaceChildren();
  Object.values(categories).forEach((category) => {
    const item = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.style.background = category.stripe;
    item.append(swatch, document.createTextNode(category.label));
    legend.append(item);
  });
}

export async function createMindMap(
  options: CreateMindMapOptions,
): Promise<MindMapController> {
  const target = resolveTarget(options.target);
  const prepared = prepareMindMap(options.yaml);
  const { config } = prepared;
  renderShell(target, prepared.title);
  renderLegend(target, config.categories);

  const svg = requiredElement<SVGElement>(target, '[data-role="canvas"]');
  const searchInput = requiredElement<HTMLInputElement>(
    target,
    '[data-role="search"]',
  );
  const colorInput = requiredElement<HTMLInputElement>(
    target,
    '[data-role="color-mode"]',
  );
  const runtimeNodes = new Map<string, INode>();
  let selectedId = '';
  let matchingIds: string[] = [];
  let matchIndex = -1;
  let colorMode: ColorMode = config.colorBy;

  const categoryOf = (node: INode) => {
    const key = `${node.payload?.category || 'unassigned'}`;
    return config.categories[key] || config.categories.unassigned;
  };
  const depthColor = (node: INode) =>
    config.depthColors[
      Math.min(Math.max(node.state.depth - 1, 0), config.depthColors.length - 1)
    ];
  const nodeFill = (node: INode) =>
    colorMode === 'category' ? categoryOf(node).fill : depthColor(node).fill;
  const nodeAccent = (node: INode) =>
    colorMode === 'category'
      ? categoryOf(node).stripe
      : depthColor(node).accent;

  colorInput.checked = colorMode === 'category';
  colorInput.addEventListener('change', () => {
    colorMode = colorInput.checked ? 'category' : 'depth';
    applyNodeStates();
  });

  await document.fonts.ready;
  const viewer = new Markmap(svg, {
    autoFit: false,
    embedGlobalCSS: true,
    lineWidth: () => 2,
    nodeMinHeight: 0,
    paddingX: 0,
    scrollForPan: false,
    toggleRecursively: false,
    color: nodeAccent,
    ...config.viewer,
  });
  await viewer.setData(prepared.root);

  function rebuildRuntimeIndex() {
    runtimeNodes.clear();
    if (!viewer.state.data) return;
    visitRuntime(viewer.state.data, (node) => {
      const id = node.payload?.id;
      if (typeof id === 'string') runtimeNodes.set(id, node);
    });
  }

  function applyNodeStates() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const groups = Array.from(
      svg.querySelectorAll<SVGGElement>('.markmap-node'),
    );
    matchingIds = [];
    groups.forEach((group) => {
      const id = group.dataset.nodeId || '';
      const node = runtimeNodes.get(id);
      const label = node?.payload?.label;
      const isMatch =
        !!query &&
        typeof label === 'string' &&
        label.toLocaleLowerCase().includes(query);
      if (isMatch) matchingIds.push(id);
      if (node) {
        const category = categoryOf(node);
        const fill = nodeFill(node);
        const accent = nodeAccent(node);
        const card = group.querySelector<HTMLElement>('.nomad-card');
        card?.style.setProperty('--category-color', category.stripe);
        card?.style.setProperty('--node-fill', fill);
        group
          .querySelector<SVGCircleElement>(':scope > circle')
          ?.style.setProperty('fill', fill);
        group
          .querySelector<SVGCircleElement>(':scope > circle')
          ?.style.setProperty('stroke', accent);
        group
          .querySelector<SVGPathElement>(':scope > .markmap-toggle')
          ?.style.setProperty('stroke', accent);
      }
      group.classList.toggle('is-search-match', isMatch);
      group.classList.toggle('is-search-dimmed', !!query && !isMatch);
      group.classList.toggle('is-selected', id === selectedId);
    });
    svg.querySelectorAll<SVGPathElement>('.markmap-link').forEach((path) => {
      const link = (
        path as SVGPathElement & {
          __data__?: { source?: INode };
        }
      ).__data__;
      if (link?.source) path.style.stroke = nodeAccent(link.source);
    });
  }

  async function renderAndFit() {
    if (!viewer.state.data) return;
    await viewer.renderData(viewer.state.data);
    rebuildRuntimeIndex();
    applyNodeStates();
    await viewer.fit(1);
  }

  async function clearSelection() {
    selectedId = '';
    await viewer.setHighlight(null);
    applyNodeStates();
  }

  async function focusNextMatch() {
    if (!matchingIds.length) return;
    matchIndex = (matchIndex + 1) % matchingIds.length;
    selectedId = matchingIds[matchIndex];
    const node = runtimeNodes.get(selectedId);
    if (!node) return;
    await viewer.setHighlight(node);
    applyNodeStates();
    const scale =
      (viewer.svg.property('__zoom') as { k?: number } | undefined)?.k || 1;
    if (scale < 0.75) await viewer.rescale(0.75 / scale);
    await viewer.centerNode(node, { top: 30, right: 30, bottom: 30, left: 30 });
  }

  async function expandAll() {
    if (!viewer.state.data) return;
    visitRuntime(viewer.state.data, (node) => {
      node.payload = { ...node.payload, fold: 0 };
    });
    await renderAndFit();
  }

  async function collapseAll() {
    if (!viewer.state.data) return;
    visitRuntime(viewer.state.data, (node) => {
      const shouldFold = node.state.depth >= 2 && node.children.length;
      node.payload = { ...node.payload, fold: shouldFold ? 1 : 0 };
    });
    await renderAndFit();
  }

  rebuildRuntimeIndex();
  applyNodeStates();
  void viewer.fit(1);

  searchInput.addEventListener('input', () => {
    matchIndex = -1;
    applyNodeStates();
  });
  searchInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') await focusNextMatch();
    if (event.key === 'Escape') {
      searchInput.value = '';
      await clearSelection();
    }
  });
  svg.addEventListener('click', async (event) => {
    const clicked = event.target;
    if (!(clicked instanceof Element)) return;
    const card = clicked.closest<HTMLElement>('.nomad-card');
    if (card) {
      selectedId = card.dataset.nodeId || '';
      const node = runtimeNodes.get(selectedId);
      if (node) await viewer.setHighlight(node);
      applyNodeStates();
      return;
    }
    if (clicked.matches('circle')) {
      rebuildRuntimeIndex();
      applyNodeStates();
      window.setTimeout(() => {
        rebuildRuntimeIndex();
        applyNodeStates();
      }, config.viewer.duration + 50);
      return;
    }
    if (selectedId) await clearSelection();
  });

  requiredElement<HTMLButtonElement>(
    target,
    '[data-role="expand-all"]',
  ).addEventListener('click', expandAll);
  requiredElement<HTMLButtonElement>(
    target,
    '[data-role="collapse-all"]',
  ).addEventListener('click', collapseAll);
  requiredElement<HTMLButtonElement>(
    target,
    '[data-role="fit"]',
  ).addEventListener('click', () => viewer.fit(1));
  requiredElement<HTMLButtonElement>(
    target,
    '[data-role="zoom-in"]',
  ).addEventListener('click', () => viewer.rescale(1.2));
  requiredElement<HTMLButtonElement>(
    target,
    '[data-role="zoom-out"]',
  ).addEventListener('click', () => viewer.rescale(0.8));

  return {
    viewer,
    getColorMode: () => colorMode,
    setColorMode(mode) {
      colorMode = mode;
      colorInput.checked = mode === 'category';
      applyNodeStates();
    },
    expandAll,
    collapseAll,
    fit: () => viewer.fit(1),
    search(query) {
      searchInput.value = query;
      matchIndex = -1;
      applyNodeStates();
      return matchingIds.length;
    },
    clearSelection,
    destroy() {
      viewer.destroy();
      target.replaceChildren();
      target.classList.remove('markmap-nomad-host');
    },
  };
}
