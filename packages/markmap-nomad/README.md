# markmap-nomad

Render a read-only, NotebookLM-style mind map from one YAML document.

## YAML input

The tree and its presentation settings live together:

```yaml
title: Project map
colorBy: depth

categories:
  data:
    label: Data
    stripe: "#2f73bd"
    fill: "#cfe2f3"
  people:
    label: People
    stripe: "#6c3bb7"
    fill: "#d9d2e9"

viewer:
  initialExpandLevel: 2

tree:
  label: Project
  children:
    - label: Data
      category: data
      children:
        - label: Catalog
        - label: Downloads
    - label: About
      children:
        - label: Team
          category: people
```

Categories inherit through descendants. A child may set another category to override the inherited value. Unknown fields and category names produce an error.

`unassigned` is built in with a gray stripe and gray category fill. It can be overridden under `categories` like any other category.

## Browser API

```ts
import { createMindMap } from 'markmap-nomad';
import 'markmap-nomad/style.css';

const controller = await createMindMap({
  target: '#mindmap-app',
  yaml,
});
```

The returned controller provides:

```ts
controller.getColorMode();
controller.setColorMode('category');
await controller.expandAll();
await controller.collapseAll();
await controller.fit();
controller.search('catalog');
await controller.clearSelection();
controller.destroy();
```

Use `prepareMindMap(yaml)` when validated tree data is needed without rendering:

```ts
const { title, root, config } = prepareMindMap(yaml);
```

## YAML fields

- `title`: displayed map title; defaults to `tree.label`.
- `colorBy`: `depth` or `category`; defaults to `depth`.
- `categories`: named category definitions with `label`, `stripe`, and `fill`.
- `depthColors`: optional list of `{ fill, accent }` depth colors.
- `viewer`: optional renderer settings.
- `tree`: one root node containing `label`, optional `category`, and optional `children`.

Supported `viewer` settings are `duration`, `fitRatio`, `initialExpandLevel`, `maxInitialScale`, `maxWidth`, `pan`, `spacingHorizontal`, `spacingVertical`, and `zoom`.

Node labels are escaped and rendered as plain text.