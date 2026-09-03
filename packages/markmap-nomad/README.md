# markmap-nomad

Render a read-only, NotebookLM-style mind map from Markdown or a structured YAML tree.

## Install

```sh
npm install https://github.com/paco-barreras/markmap-nomad/releases/download/v0.2.1/markmap-nomad-0.2.1.tgz
```

## Standalone HTML

```sh
npx --yes --package=https://github.com/paco-barreras/markmap-nomad/releases/download/v0.2.1/markmap-nomad-0.2.1.tgz markmap-nomad map.md
```

This writes `map.html`. Use `-o output.html` to choose another filename. Markdown, `.yaml`, and `.yml` inputs are supported.

## Markdown input

Any Markmap-style heading or list hierarchy works. Put category definitions in YAML front matter and add a trailing `#cat/name` only where a category begins:

```markdown
---
title: Project map
markmap:
  colorBy: depth
  initialExpandLevel: 2
  categories:
    data:
      label: Data
      color: '#2f73bd'
      fill: '#cfe2f3'
    people:
      label: People
      color: '#6c3bb7'
      fill: '#d9d2e9'
---

# Project

## Data #cat/data

### Catalog

### Downloads

## About

### Team #cat/people

#### Researchers
```

The tag is removed from the displayed label. Descendants inherit the category; a deeper tag overrides it. Use `#cat/unassigned` to reset inheritance. Category names are lowercase slugs and unknown names produce an error.

The same syntax works in lists:

```markdown
- Data #cat/data
  - Catalog
- About
  - Team #cat/people
```

```ts
const controller = await createMindMap({ target: '#mindmap-app', markdown });
```

## YAML input

For a structured tree instead of a note:

```yaml
title: Project map
colorBy: depth

categories:
  data:
    label: Data
    color: '#2f73bd'
    fill: '#cfe2f3'
  people:
    label: People
    color: '#6c3bb7'
    fill: '#d9d2e9'

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
await controller.setColorMode('category');
await controller.expandAll();
await controller.collapseAll();
await controller.fit();
controller.search('catalog');
await controller.clearSelection();
controller.destroy();
```

## YAML fields

- `title`: displayed map title; defaults to `tree.label`.
- `colorBy`: `depth` or `category`; defaults to `depth`.
- `categories`: named category definitions with `label`, `color`, and `fill`.
- `depthColors`: optional list of `{ fill, accent }` depth colors.
- `viewer`: optional renderer settings.
- `tree`: one root node containing `label`, optional `category`, and optional `children`.

Supported `viewer` settings are `duration`, `fitRatio`, `initialExpandLevel`, `maxInitialScale`, `maxWidth`, `pan`, `spacingHorizontal`, `spacingVertical`, and `zoom`.

YAML node labels are escaped and rendered as plain text. Markdown nodes retain the inline formatting supported by Markmap; only use trusted Markdown input.
