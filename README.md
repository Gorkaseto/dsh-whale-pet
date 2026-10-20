# DSH Whale Pet

A lightweight, pixel-art companion plugin for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) (`dsh-whale-pet`) that adds an animated whale pet above the input composer during new sessions.

Drawn in the style of the DeepSeek whale logo, this little companion keeps you company when opening a fresh conversation and automatically tucks away once you start chatting.

## Features

- **Animated Pixel Art**: Handcrafted inline SVG sprite that bobs, blinks, flaps its tail, and spouts water every few seconds.
- **Interactive**: Click or tap the whale anytime to make it perform an instant hop and water spout.
- **Unobtrusive**: Appears exclusively on empty new sessions and gracefully disappears the moment you send a message or start a run.
- **Lightweight & Crisp**: Rendered with crisp pixel rendering (`shape-rendering: crispEdges`) and stepped CSS keyframes without heavy external asset dependencies.
- **Accessible**: Automatically halts animations when `prefers-reduced-motion` is enabled in system settings.
- **Localization**: Supports English (`en`) and Chinese (`zh`) accessibility descriptions.

## How It Works

- Hooks into the `conversation.input.dock` slot directly above the composer card.
- Evaluates session activity (`blank && !running && !promptAttempted`) so it stays completely out of the way during active conversations.
- Renders as a self-contained inline SVG using CSS step-timing functions to emulate classic retro sprite sheets.

## Installation

Install the plugin into your DSH web profile:

```sh
# From a local folder
dsh plugin --profile web add file:path/to/dsh-whale-pet

# Or directly from a Git repository
dsh plugin --profile web add https://github.com/Gorkaseto/dsh-whale-pet.git
```

## Project Structure

```text
├── client.js          # Client module: pixel-art sprite SVG, animations, and dock integration
├── index.js           # Host service entry point
├── cordis.patch.yml   # Cordis plugin manifest definition
├── icon.svg           # Plugin icon
├── locale/            # Internationalization metadata files (en.json, zh.json)
├── package.json       # Plugin manifest and dependencies
├── LICENSE            # Apache-2.0 License
└── NOTICE             # Copyright and attribution notices
```

## License

Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE) for details.
