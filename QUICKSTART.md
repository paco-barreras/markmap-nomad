# Quickstart

## Install

```sh
npm install github:paco-barreras/markmap-nomad#v0.3.0
```

## Create HTML

Save your note as `map.md`:

```markdown
# Main topic

## First branch

### Child node

## Second branch
```

Run:

```sh
npx markmap-nomad map.md
```

Open `map.html`.

## Use in an application

```ts
import { createMindMap } from 'markmap-nomad';
import 'markmap-nomad/style.css';
import markdown from './map.md?raw';

void createMindMap({ target: '#mindmap', markdown });
```

```html
<div id="mindmap" style="width: 100vw; height: 100vh"></div>
```
