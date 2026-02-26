# Sora Sprite Sheet Generator

Generate animated sprite sheets from a pixel art reference image using OpenAI's Sora API.

## Setup

1. **Install [uv](https://docs.astral.sh/uv/getting-started/installation/)** if you haven't already:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Add your OpenAI API key.** Copy the example and fill in your key:
   ```bash
   cp .env.example .env
   # Edit .env and paste your real key
   ```

3. **Place your image** in the project folder as `original.png` (already included).

## Usage

Run with `uv run` — it handles the virtual environment and dependencies automatically:

```bash
# Flying animation (default preset)
uv run generate.py --prompt flying

# Other built-in presets
uv run generate.py --prompt idle
uv run generate.py --prompt walking
uv run generate.py --prompt pecking

# Custom prompt (just type it directly)
uv run generate.py --prompt "The bird dives downward then pulls up, looping. Pure white background, flat 2D side view, same size throughout."

# Load prompt from a text file
uv run generate.py --prompt my_prompt.txt

# Use the pro model for higher quality
uv run generate.py --prompt flying --model sora-2-pro

# Change resolution and duration
uv run generate.py --prompt flying --size 1280x720 --seconds 8

# Use a different input image
uv run generate.py --prompt flying --image my_other_bird.png
```

## Output

All outputs are saved to the `output/` folder:
- `*_spritesheet.png` — the sprite sheet (what you want!)
- `*_thumbnail.png` — a thumbnail frame
- `*.mp4` — the full video

## Adding New Presets

Open `generate.py` and add entries to the `PROMPT_PRESETS` dictionary:

```python
PROMPT_PRESETS = {
    "flying": "...",
    "idle": "...",
    "attack": (                          # ← add your own
        "Animate this pixel art bird attacking with a quick lunge forward. "
        "Pure white #FFFFFF background. Flat 2D side view..."
    ),
}
```

Then just run: `uv run generate.py --prompt attack`

## Options

| Flag        | Default        | Description                                           |
|-------------|----------------|-------------------------------------------------------|
| `--prompt`  | *(required)*   | Preset name, `.txt` file, or raw prompt text          |
| `--image`   | `original.png` | Path to the input reference image                     |
| `--model`   | `sora-2`       | `sora-2` (fast/cheap) or `sora-2-pro` (higher quality)|
| `--size`    | `1024x1024`    | Video resolution (see `--help` for all options)       |
| `--seconds` | `5`            | Duration 1–20 seconds                                 |

## Tips for Best Results

- **Square (1024x1024)** tends to keep the character centered and consistent in scale.
- **Shorter durations (3–5s)** are cheaper and often enough for a good loop cycle.
- **sora-2** is fine for iteration; switch to **sora-2-pro** once you have a prompt you like.
- If Sora adds background elements, make the prompt even more explicit about "pure white, no objects, no shadows."
- You may need to re-run a few times — Sora is non-deterministic and some runs will be more consistent than others.
