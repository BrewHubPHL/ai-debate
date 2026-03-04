# AI Debate Arena

Retro-style between-rounds debate screen inspired by classic boxing game dialogue.

## Stack

- React + Vite
- Local Ollama API (`http://localhost:11434`)

## Features

- Captain Capslock vs Lil Zoomer sprite dialogue
- Turn-based argument loop with topic rotation
- Rage meters, round winner detection, and running W/L tally
- Active speaker highlighting and talk/idle animation flicker
- Prompt hardening to reduce repetitive arguments
- Public-display safeguards (line clamping, basic content filtering, offline/degraded status)

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Ensure Ollama is installed and running with `llama3.2` available.

3. Start the app:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```
