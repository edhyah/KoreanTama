"""
Sora Sprite Sheet Generator
============================
Generates animated sprite sheets from a reference image using OpenAI's Sora API.

Usage:
    uv run generate.py --prompt flying
    uv run generate.py --prompt idle
    uv run generate.py --prompt "custom prompt text here"
    uv run generate.py --prompt flying --model sora-2-pro --seconds 4
    uv run generate.py --prompt flying --size 1920x1080

Requires OPENAI_API_KEY in a .env file or as an environment variable.
"""

import os
import sys
import time
import argparse
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from PIL import Image
import io

# ---------------------------------------------------------------------------
# PROMPT PRESETS — add or edit these to quickly switch between animations
# ---------------------------------------------------------------------------
PROMPT_PRESETS: dict[str, str] = {
    "flying": (
        "Animate this pixel art bird character flying with a smooth wing-flapping "
        "cycle. The bird flaps its wings up and down in a looping flight animation. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement, no perspective shift. "
        "The character stays the exact same size, scale, and position throughout "
        "every frame. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "idle": (
        "Animate this pixel art bird character with a visible breathing animation. "
        "The bird's chest and belly visibly expand and contract in a slow, rhythmic "
        "breathing motion. The body gently puffs up as it inhales, then deflates slightly "
        "as it exhales. Feathers subtly ruffle with each breath. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "walking": (
        "Animate this pixel art bird character walking to the right with a cute "
        "bouncing walk cycle. The feet alternate in a stepping motion. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "pecking": (
        "Animate this pixel art bird character pecking at the ground repeatedly. "
        "The bird leans forward and taps its beak down, then returns upright, in a loop. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "eating": (
        "Animate this pixel art bird character eating. The bird opens and closes its beak "
        "in a chewing motion while small crumb particles fall from its beak. The bird looks "
        "content while munching. No actual food item shown, just the eating action with crumbs. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "surprised": (
        "Animate this pixel art bird character reacting to being touched. The bird first "
        "jumps slightly with wide surprised eyes and ruffled feathers, then transitions into "
        "a happy expression with eyes closing contentedly and a slight wiggle of joy. "
        "The reaction goes from startled to pleased. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "hungry": (
        "Animate this pixel art bird character looking hungry. The bird's belly visibly "
        "rumbles and shakes. The bird looks down at its stomach with a sad, longing expression. "
        "Small motion lines appear around the belly to show rumbling. The bird occasionally "
        "glances around hopefully looking for food. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The character stays the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
    "hatching": (
        "Animate a pixel art egg slowly cracking and hatching into this bird character. "
        "The egg starts whole, then small cracks appear and spread across the shell. "
        "The egg wobbles and shakes as the bird inside pushes. Pieces of shell break off "
        "gradually until the bird emerges, looking around with fresh curious eyes. "
        "Pure white #FFFFFF background. Flat 2D side view, perfectly orthographic. "
        "No rotation, no zoom, no camera movement. The egg and bird stay the exact same "
        "size and scale throughout. No shadows, no gradients, no environmental elements. "
        "Pixel art style preserved exactly."
    ),
}

# ---------------------------------------------------------------------------
# Video size options (width x height)
# ---------------------------------------------------------------------------
VALID_SIZES = [
    "1280x720", "720x1280",
    "1792x1024", "1024x1792",
]

DEFAULT_SIZE = "1280x720"
DEFAULT_MODEL = "sora-2"
DEFAULT_SECONDS = 4
DEFAULT_IMAGE = "original.png"
OUTPUT_DIR = "output"


def get_client() -> OpenAI:
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY not found.")
        print("Set it in a .env file (OPENAI_API_KEY=sk-...) or export it.")
        sys.exit(1)
    return OpenAI(api_key=api_key)


def resolve_prompt(prompt_input: str) -> str:
    """Resolve a prompt from a preset name, a .txt file path, or raw text."""
    # Check presets first
    if prompt_input in PROMPT_PRESETS:
        print(f"Using preset prompt: '{prompt_input}'")
        return PROMPT_PRESETS[prompt_input]

    # Check if it's a file
    if prompt_input.endswith(".txt") and Path(prompt_input).exists():
        print(f"Loading prompt from file: {prompt_input}")
        return Path(prompt_input).read_text().strip()

    # Otherwise treat as raw prompt text
    print("Using custom prompt text.")
    return prompt_input


def resize_image_to_match(image_path: str, target_size: str) -> bytes:
    """Resize the input image to match the target video resolution and return as bytes."""
    width, height = map(int, target_size.split("x"))
    img = Image.open(image_path)

    # Use NEAREST resampling to preserve pixel art crispness
    img_resized = img.resize((width, height), Image.NEAREST)

    # Convert to RGB if RGBA (Sora expects JPEG/PNG without issues, but let's be safe)
    if img_resized.mode == "RGBA":
        # Composite onto white background
        bg = Image.new("RGB", img_resized.size, (255, 255, 255))
        bg.paste(img_resized, mask=img_resized.split()[3])
        img_resized = bg

    buf = io.BytesIO()
    img_resized.save(buf, format="PNG")
    buf.seek(0)
    return buf


def create_video(client: OpenAI, prompt: str, image_path: str,
                 model: str, size: str, seconds: int) -> str:
    """Submit a video generation job and return the video ID."""
    image_buf = resize_image_to_match(image_path, size)

    print(f"\nSubmitting video generation job...")
    print(f"  Model:    {model}")
    print(f"  Size:     {size}")
    print(f"  Duration: {seconds}s")
    print(f"  Image:    {image_path}")
    print(f"  Prompt:   {prompt[:80]}{'...' if len(prompt) > 80 else ''}")

    video = client.videos.create(
        model=model,
        input_reference=("image.png", image_buf, "image/png"),
        prompt=prompt,
        size=size,
        seconds=seconds,
    )

    print(f"  Video ID: {video.id}")
    return video.id


def wait_for_completion(client: OpenAI, video_id: str,
                        poll_interval: int = 10, timeout: int = 600):
    """Poll until the video job completes or fails."""
    print(f"\nWaiting for video to finish (polling every {poll_interval}s, timeout {timeout}s)...")
    elapsed = 0
    while elapsed < timeout:
        job = client.videos.retrieve(video_id)
        status = job.status
        progress = getattr(job, "progress", None)
        progress_str = f"{progress}%" if progress is not None else "?"
        print(f"  [{elapsed:>4}s] Status: {status}, Progress: {progress_str}")

        if status == "completed":
            print("  Video generation complete!")
            return job
        if status == "failed":
            error_msg = getattr(job, "error", None)
            if error_msg and hasattr(error_msg, "message"):
                error_msg = error_msg.message
            raise RuntimeError(f"Video generation failed: {error_msg}")

        time.sleep(poll_interval)
        elapsed += poll_interval

    raise RuntimeError(f"Timed out after {timeout}s waiting for video {video_id}")


def download_outputs(client: OpenAI, video_id: str, prompt_name: str):
    """Download the sprite sheet, thumbnail, and video."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base = f"{OUTPUT_DIR}/{prompt_name}_{video_id}"

    variants = {
        "spritesheet": f"{base}_spritesheet.png",
        "thumbnail": f"{base}_thumbnail.png",
        "video": f"{base}.mp4",
    }

    for variant, filepath in variants.items():
        try:
            print(f"  Downloading {variant}...")
            response = client.videos.download_content(
                video_id=video_id,
                variant=variant,
            )
            data = response.read()
            with open(filepath, "wb") as f:
                f.write(data)
            print(f"    Saved: {filepath} ({len(data) / 1024:.1f} KB)")
        except Exception as e:
            print(f"    Skipped {variant}: {e}")

    return variants


def main():
    parser = argparse.ArgumentParser(
        description="Generate animated sprite sheets from a reference image using Sora.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"Available prompt presets: {', '.join(PROMPT_PRESETS.keys())}",
    )
    parser.add_argument(
        "--prompt", required=True,
        help="A preset name (flying, idle, walking, pecking, eating, surprised, hungry, hatching), a .txt file path, or raw prompt text.",
    )
    parser.add_argument(
        "--image", default=DEFAULT_IMAGE,
        help=f"Path to the input image (default: {DEFAULT_IMAGE}).",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL, choices=["sora-2", "sora-2-pro"],
        help=f"Sora model to use (default: {DEFAULT_MODEL}).",
    )
    parser.add_argument(
        "--size", default=DEFAULT_SIZE, choices=VALID_SIZES,
        help=f"Video resolution WxH (default: {DEFAULT_SIZE}).",
    )
    parser.add_argument(
        "--seconds", type=int, default=DEFAULT_SECONDS, choices=[4, 8, 12],
        metavar="4|8|12",
        help=f"Video duration in seconds (default: {DEFAULT_SECONDS}).",
    )

    args = parser.parse_args()

    if not Path(args.image).exists():
        print(f"Error: Image file not found: {args.image}")
        sys.exit(1)

    prompt = resolve_prompt(args.prompt)

    # Determine a short name for output files
    prompt_name = args.prompt if args.prompt in PROMPT_PRESETS else "custom"

    client = get_client()
    video_id = create_video(client, prompt, args.image, args.model, args.size, args.seconds)
    wait_for_completion(client, video_id)

    print(f"\nDownloading outputs...")
    variants = download_outputs(client, video_id, prompt_name)

    print(f"\nDone! Files saved to {OUTPUT_DIR}/")
    print(f"  Sprite sheet: {variants.get('spritesheet', 'N/A')}")


if __name__ == "__main__":
    main()
