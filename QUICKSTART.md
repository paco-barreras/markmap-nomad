# Use markmap-nomad in another project

This example works in a Vite application. You do not need to clone the markmap-nomad repository.

## 1. Install

```sh
npm install https://github.com/paco-barreras/markmap-nomad/releases/download/v0.2.0/markmap-nomad-0.2.0.tgz
```

The package is self-contained. Do not install Markmap separately.

## 2. Add a note

Create `src/map.md`:

```markdown
# Main topic

## First branch

### Child node

## Second branch
```

## 3. Render the note

Add a sized container:

```html
<div id="mindmap" style="width: 100vw; height: 100vh"></div>
```

Then use it in your JavaScript or TypeScript entry file:

```ts
import { createMindMap } from 'markmap-nomad';
import 'markmap-nomad/style.css';
import markdown from './map.md?raw';

void createMindMap({ target: '#mindmap', markdown });
```

Run or build your application normally. See the package README for categories and YAML input.
