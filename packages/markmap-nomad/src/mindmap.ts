import { type INode, loadCSS, loadJS, walkTree } from 'markmap-common';
import { Transformer } from 'markmap-lib';
import * as markmapView from 'markmap-view';
import {
  depthColorAt,
  prepareMarkdownWithTransformer,
  prepareYamlMindMap,
  type PreparedMindMap,
} from './prepare';
import { renderShell, resolveTarget } from './shell';
import type {
  ColorMode,
  CreateMindMapOptions,
  MindMapController,
} from './types';

const activeControllers = new WeakMap<HTMLElement, MindMapController>();

export async function createMindMap(
  options: CreateMindMapOptions,
): Promise<MindMapController> {
  const target = resolveTarget(options.target);
  let prepared: PreparedMindMap;
  let markdownTransformer: Transformer | undefined;
  if (typeof options.markdown === 'string' && options.yaml === undefined) {
    markdownTransformer = new Transformer();
    prepared = prepareMarkdownWithTransformer(
      options.markdown,
      markdownTransformer,
    );
  } else if (
    typeof options.yaml === 'string' &&
    options.markdown === undefined
  ) {
    prepared = prepareYamlMindMap(options.yaml);
  } else {
    throw new Error('Provide exactly one mind map source: markdown or yaml');
  }
  const { config } = prepared;
  if (prepared.assets?.styles) await loadCSS(prepared.assets.styles);
  if (prepared.assets?.scripts) {
    await loadJS(prepared.assets.scripts, {
      getMarkmap: () => markmapView,
    });
  }
  activeControllers.get(target)?.destroy();
  const { svg, searchInput, colorInput } = renderShell(
    target,
    prepared.title,
    config.categories,
  );
  const events = new AbortController();
  let destroyed = false;
  let selectedNode: INode | undefined;
  let matchingNodes: INode[] = [];
  let matchIndex = -1;
  let colorMode: ColorMode = config.colorBy;

  const categoryOf = (node: INode) => {
    const key = `${node.payload?.category || 'unassigned'}`;
    return config.categories[key] || config.categories.unassigned;
  };
  const depthColor = (node: INode) =>
    depthColorAt(config, node.state.depth - 1);
  const nodeFill = (node: INode) =>
    colorMode === 'category' ? categoryOf(node).fill : depthColor(node).fill;
  const nodeAccent = (node: INode) =>
    colorMode === 'category' ? categoryOf(node).color : depthColor(node).accent;

  const updateColorModeClass = () => {
    target.classList.toggle('color-by-category', colorMode === 'category');
  };
  updateColorModeClass();
  colorInput.checked = colorMode === 'category';

  await document.fonts.ready;
  const viewer = new markmapView.Markmap(svg, {
    autoFit: false,
    embedGlobalCSS: true,
    lineWidth: () => 2,
    nodeMinHeight: 0,
    paddingX: 0,
    scrollForPan: false,
    toggleRecursively: false,
    color: nodeAccent,
    circleFill: nodeFill,
    ...config.viewer,
  });

  function updateNodeClasses() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const groups = Array.from(
      svg.querySelectorAll<SVGGElement>('.markmap-node'),
    );
    matchingNodes = [];
    groups.forEach((group) => {
      const node = (group as SVGGElement & { __data__?: INode }).__data__;
      if (!node) return;
      const label = node.payload?.label;
      const isMatch =
        !!query &&
        typeof label === 'string' &&
        label.toLocaleLowerCase().includes(query);
      if (isMatch) matchingNodes.push(node);
      group.classList.toggle('is-search-match', isMatch);
      group.classList.toggle('is-search-dimmed', !!query && !isMatch);
      group.classList.toggle('is-selected', node === selectedNode);
    });
  }

  viewer.renderHooks.tap(updateNodeClasses);
  let refreshTask: Promise<void> | undefined;
  let refreshRequested = false;
  const refreshMarkdown = () => {
    if (!markdownTransformer || destroyed || options.markdown === undefined)
      return Promise.resolve();
    if (refreshTask) {
      refreshRequested = true;
      return refreshTask;
    }
    refreshTask = (async () => {
      do {
        refreshRequested = false;
        const refreshed = prepareMarkdownWithTransformer(
          options.markdown,
          markdownTransformer,
        );
        if (destroyed) return;
        await viewer.setData(refreshed.root);
      } while (refreshRequested && !destroyed);
    })().finally(() => {
      refreshTask = undefined;
    });
    return refreshTask;
  };
  const releaseRetransform = markdownTransformer?.hooks.retransform.tap(() => {
    void refreshMarkdown();
  });
  if (markdownTransformer) await refreshMarkdown();
  else await viewer.setData(prepared.root);

  function currentRoot() {
    if (!viewer.state.data)
      throw new Error('Markmap did not initialize the tree');
    return viewer.state.data;
  }

  async function renderAndFit() {
    await viewer.renderData();
    await viewer.fit(1);
  }

  async function clearSelection() {
    selectedNode = undefined;
    await viewer.setHighlight(null);
  }

  async function focusNextMatch() {
    if (!matchingNodes.length) return;
    matchIndex = (matchIndex + 1) % matchingNodes.length;
    selectedNode = matchingNodes[matchIndex];
    await viewer.setHighlight(selectedNode);
    await viewer.centerNode(selectedNode, {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30,
    });
  }

  async function expandAll() {
    walkTree(currentRoot(), (node, next) => {
      node.payload = { ...node.payload, fold: 0 };
      next();
    });
    await renderAndFit();
  }

  async function collapseAll() {
    walkTree(currentRoot(), (node, next) => {
      const shouldFold = node.state.depth >= 2 && node.children.length;
      node.payload = { ...node.payload, fold: shouldFold ? 1 : 0 };
      next();
    });
    await renderAndFit();
  }

  const listenerOptions = { signal: events.signal };
  colorInput.addEventListener(
    'change',
    () => void setColorMode(colorInput.checked ? 'category' : 'depth'),
    listenerOptions,
  );
  searchInput.addEventListener(
    'input',
    () => {
      matchIndex = -1;
      updateNodeClasses();
    },
    listenerOptions,
  );
  searchInput.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Enter') void focusNextMatch();
      if (event.key === 'Escape') {
        searchInput.value = '';
        void clearSelection();
      }
    },
    listenerOptions,
  );
  target.addEventListener(
    'click',
    (event) => {
      const clicked = event.target;
      if (!(clicked instanceof Element)) return;
      const action =
        clicked.closest<HTMLButtonElement>('button[data-role]')?.dataset.role;
      if (action === 'expand-all') void expandAll();
      else if (action === 'collapse-all') void collapseAll();
      else if (action === 'fit') void viewer.fit(1);
      else if (action === 'zoom-in') void viewer.rescale(1.2);
      else if (action === 'zoom-out') void viewer.rescale(0.8);
      if (action || !svg.contains(clicked) || clicked.matches('circle')) return;

      const group = clicked.closest<SVGGElement>('.markmap-node') as
        | (SVGGElement & { __data__?: INode })
        | null;
      if (clicked.closest('.nomad-card') && group?.__data__) {
        selectedNode = group.__data__;
        void viewer.setHighlight(selectedNode);
      } else if (selectedNode) {
        void clearSelection();
      }
    },
    listenerOptions,
  );

  async function setColorMode(mode: ColorMode) {
    if (mode === colorMode) return;
    colorMode = mode;
    colorInput.checked = mode === 'category';
    updateColorModeClass();
    await viewer.renderData();
  }

  const controller: MindMapController = {
    getColorMode: () => colorMode,
    setColorMode,
    expandAll,
    collapseAll,
    fit: () => viewer.fit(1),
    search(query) {
      searchInput.value = query;
      matchIndex = -1;
      updateNodeClasses();
      return matchingNodes.length;
    },
    clearSelection,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      events.abort();
      releaseRetransform?.();
      viewer.destroy();
      target.replaceChildren();
      target.classList.remove('markmap-nomad-host', 'color-by-category');
      activeControllers.delete(target);
    },
  };
  activeControllers.set(target, controller);
  void viewer.fit(1);
  return controller;
}
