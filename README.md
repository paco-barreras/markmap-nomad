# markmap

[![Join the chat at https://gitter.im/gera2ld/markmap](https://badges.gitter.im/gera2ld/markmap.svg)](https://gitter.im/gera2ld/markmap?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Visualize your Markdown as mindmaps.

This project is heavily inspired by [dundalek's markmap](https://github.com/dundalek/markmap).

## NOMAD Viewer

This fork includes a NotebookLM-style, read-only viewer with Markdown categories, search, folding, and depth/category color modes.

Install the self-contained package from the GitHub release:

```sh
npm install https://github.com/paco-barreras/markmap-nomad/releases/download/v0.2.0/markmap-nomad-0.2.0.tgz
```

See [QUICKSTART.md](QUICKSTART.md) for the minimal setup and [the package README](packages/markmap-nomad/README.md) for category syntax and API details.

👉 [Try it out](https://markmap.js.org/repl).

## Related Projects

Markmap is also available in:

- [VSCode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) and [Open VSX](https://open-vsx.org/extension/gera2ld/markmap-vscode)
- Vim / Neovim:
  - [coc-markmap](https://github.com/gera2ld/coc-markmap) ![NPM](https://img.shields.io/npm/v/coc-markmap.svg) - powered by [coc.nvim](https://github.com/neoclide/coc.nvim)
  - [markmap.vim](https://github.com/Zeioth/markmap.nvim): for using without [coc.nvim](https://github.com/neoclide/coc.nvim)
- Emacs: [eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) -- powered by [EAF](https://github.com/emacs-eaf/emacs-application-framework)
- MCP Server: [markmap-mcp-server](https://github.com/jinzcdev/markmap-mcp-server) [![NPM Version](https://img.shields.io/npm/v/@jinzcdev/markmap-mcp-server.svg)](https://www.npmjs.com/package/@jinzcdev/markmap-mcp-server) - powered by [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- AI agents: [mindmap-skills](https://github.com/galiacheng/mindmap-skills) - generate an interactive Markmap from a file, URL, or topic, without leaving your AI agent

## Usage

👉 [Read the documentation](https://markmap.js.org/docs) for more detail.
