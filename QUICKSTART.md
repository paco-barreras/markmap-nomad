# Use markmap-nomad in another project

## Install

Until the package is published, create its self-contained tarball once:

```powershell
# In the markmap-nomad repository
npm run package:pack
```

Give `markmap-nomad-0.2.0.tgz` to the consuming project, then install it there:

```powershell
npm install C:\path\to\markmap-nomad-0.2.0.tgz
```

After publication, use `npm install markmap-nomad` instead. Consumers do not need the monorepo or separate Markmap packages.

## Add a note

Create `src/map.md`:

```markdown
# Main topic

## First branch

### Child node

## Second branch
```

## Render it

In a Vite entry file:

```ts
import { createMindMap } from 'markmap-nomad';
import 'markmap-nomad/style.css';
import markdown from './map.md?raw';

void createMindMap({ target: '#mindmap', markdown });
```

Add a sized container to the page:

```html
<div id="mindmap" style="width: 100vw; height: 100vh"></div>
```

Run or build the consuming project normally. Category configuration and `#cat/name` syntax are documented in the package README.
