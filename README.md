# Pastime - GitHub Activity Graph Customizer

[![Website](https://img.shields.io/badge/Website-Live_Theme_Builder-blue?style=for-the-badge)](https://Liyfez.github.io/Pastime/)

Pastime is a tool to perfectly customize your GitHub Activity Graph and embed it in your Profile README.

Unlike other tools, Pastime supports **Private Commits** and exact **Current Calendar Year** mapping by running securely inside your own GitHub Actions! It exactly replicates the GitHub heat map calculation (quartiles) to ensure your custom colors apply flawlessly.

## Features
- 🔒 **Private Commits**: Authenticates as you to include all your private contributions.
- 🎨 **Adaptive Theming**: Supports both Light and Dark mode using pure CSS embedded in the SVG!
- 📅 **Current Year Lock**: Shows the true current calendar year instead of a rolling 365 days.
- 🖌️ **Theme Builder**: Use the [Live Theme Builder](https://Liyfez.github.io/Pastime/) to visually create your color palette.

## Getting Started

1. **Fork this repository** (or click "Use this template" if available).
2. Go to **Settings > Secrets and variables > Actions** in your new repository.
3. Add a New Repository Secret called `GH_TOKEN_FOR_GRAPH` and paste a GitHub Personal Access Token (PAT) with `read:user` and `repo` scopes.
4. Customize your themes in the `.github/workflows/update-graph.yml` file (or use the Theme Builder to generate the code).
5. The graph will automatically generate at midnight and save as `activity-graph.svg`.

## Embedding in your Profile

Once the action runs and generates the SVG in your repository, simply add this to your Profile README:

```markdown
![My Custom Activity Graph](https://raw.githubusercontent.com/YOUR_USERNAME/Pastime/main/activity-graph.svg)
```

## Creating Custom Themes

Visit the **[Pastime Theme Builder](https://Liyfez.github.io/Pastime/)** to visually pick colors, see a live preview, and automatically generate the GitHub Actions configuration code!
