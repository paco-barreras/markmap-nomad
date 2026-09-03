# markmap-nomad

A read-only mind-map viewer based on [Markmap](https://github.com/markmap/markmap), with a NotebookLM-style layout and presentation.

## Install

```sh
npm install github:paco-barreras/markmap-nomad#v0.3.0
```

## Standalone HTML

Create `map.md`, then run:

```sh
npx markmap-nomad map.md
```

Open the generated `map.html`. Use `-o output.html` to choose another filename.

## Application

```ts
import { createMindMap } from 'markmap-nomad';
import 'markmap-nomad/style.css';
import markdown from './map.md?raw';

void createMindMap({ target: '#mindmap', markdown });
```

```html
<div id="mindmap" style="width: 100vw; height: 100vh"></div>
```

## Categories

Define categories in YAML front matter and assign them with trailing `#cat/<name>` tags:

```markdown
---
markmap:
  colorBy: category
  categories:
    research:
      label: Research
      color: '#2f73bd'
      fill: '#cfe2f3'
---

# Project

## Research #cat/research

### Reports

### Data

## Notes #cat/unassigned
```

Categories are inherited by descendants. A later tag overrides the inherited category. `#cat/unassigned` resets a branch. `colorBy: depth` uses depth colors; `colorBy: category` uses category colors. Category stripes always use the category color.

## Markmap

This fork is based on [Markmap](https://github.com/markmap/markmap).
