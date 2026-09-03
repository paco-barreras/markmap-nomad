# Create a standalone mind map

Save a note as `map.md`:

```markdown
# Main topic

## First branch

### Child node

## Second branch
```

Run:

```sh
npx --yes --package=https://github.com/paco-barreras/markmap-nomad/releases/download/v0.2.1/markmap-nomad-0.2.1.tgz markmap-nomad map.md
```

Open `map.html`.

Use `-o another-name.html` to choose the output filename. See the package README for categories, YAML input, and library usage.
