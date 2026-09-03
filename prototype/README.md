# Markdown-driven demo

Edit `NOMAD.md`. Its YAML front matter defines categories and its headings define the tree. `NOMAD.yaml` demonstrates the alternative structured-tree input.

Run from the repository root:

```powershell
corepack pnpm run prototype
```

The application code in `app.ts` only loads the Markdown file and calls `createMindMap()`.
