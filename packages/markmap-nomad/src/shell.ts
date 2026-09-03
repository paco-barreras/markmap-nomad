import type { MindMapCategory } from './types';

export interface MindMapShell {
  svg: SVGElement;
  searchInput: HTMLInputElement;
  colorInput: HTMLInputElement;
}

function requiredElement<ElementType extends Element>(
  parent: ParentNode,
  selector: string,
): ElementType {
  const element = parent.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Missing mind map element: ${selector}`);
  return element;
}

export function resolveTarget(target: string | HTMLElement) {
  const element =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;
  if (!element) throw new Error(`Mind map target not found: ${target}`);
  return element;
}

export function renderShell(
  target: HTMLElement,
  title: string,
  categories: Record<string, MindMapCategory>,
): MindMapShell {
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

  const legend = requiredElement<HTMLElement>(target, '[data-role="legend"]');
  const mapKey = requiredElement<HTMLElement>(target, '.map-key');
  mapKey.hidden = Object.keys(categories).every(
    (category) => category === 'unassigned',
  );
  Object.values(categories).forEach((category) => {
    const item = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.style.background = category.color;
    item.append(swatch, document.createTextNode(category.label));
    legend.append(item);
  });

  return {
    svg,
    searchInput: requiredElement<HTMLInputElement>(
      target,
      '[data-role="search"]',
    ),
    colorInput: requiredElement<HTMLInputElement>(
      target,
      '[data-role="color-mode"]',
    ),
  };
}
