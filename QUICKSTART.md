# Create a mind map

## 1. Edit the YAML

Replace `prototype/NOMAD.yaml` with your tree:

```yaml
title: My mind map
colorBy: depth

tree:
  label: Main topic
  children:
    - label: First branch
      children:
        - label: Child node
    - label: Second branch
```

Each node needs `label`. It may also have `children` and `category`. See `prototype/NOMAD.yaml` for category and color examples. A category is inherited by its children.

## 2. Preview

From the repository root:

```powershell
corepack pnpm install
corepack pnpm run prototype
```

Open the URL printed in the terminal.

## 3. Build HTML

```powershell
corepack pnpm run prototype:build
```

The result is `prototype-dist/index.html`. Keep the generated `prototype-dist/assets` directory beside it; publish or copy the entire `prototype-dist` folder.
