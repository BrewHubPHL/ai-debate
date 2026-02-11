# AI Debate Arena 🤬 vs 😒

A Terminal-based AI debate game where two AI personas argue about absurd topics in an infinite loop.

## Features

- **8-bit pixel art characters** with animations (bounce, shake, attack poses)
- **Two unique personas**:
  - 🤬 **Captain Capslock** - An angry boomer who TYPES IN ALL CAPS
  - 😒 **Lil' Zoomer** - A sarcastic Gen-Z teen with slang like "no cap" and "fr fr"
- **30+ absurd debate topics** including:
  - Is a hotdog a sandwich?
  - Is water wet?
  - Are birds real?
  - Is a pop tart a ravioli?
- **Rage meters** that change based on sentiment analysis
- **Attack animations** with POW!, BAM!, WHAM! effects

## Requirements

- Python 3.8+
- GitHub CLI (`gh.exe`) with Copilot access
- Dependencies: `pip install textblob rich`

## Usage

```bash
python debate.py
```

Select a topic (or let it pick randomly) and watch the chaos unfold!

Press `Ctrl+C` to end the debate and see the final score.

## How It Works

1. Each AI gets a persona prompt
2. They respond to each other's arguments via `gh copilot`
3. Sentiment analysis determines "anger level"
4. Higher anger = winning the round
5. Character animations play during responses

## License

MIT - Have fun with it!
