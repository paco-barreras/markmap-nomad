# YAML-driven demo

Edit `NOMAD.yaml`. It contains the tree, title, categories, palette, and viewer settings.

Run from the repository root:

```powershell
corepack pnpm run prototype
```

The application code in `app.ts` only loads that file and calls `createMindMap()`.