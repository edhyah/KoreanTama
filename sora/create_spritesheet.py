#!/usr/bin/env python3
"""
Sprite Sheet Generator

Combines animation frames from output/sprite_frames/ into a single sprite sheet.
"""

from pathlib import Path
from PIL import Image

# Configurable parameters
FRAME_SIZE = 128
BACKGROUND_COLOR = (255, 255, 255)  # White - easily changeable

# Paths
INPUT_DIR = Path("output/sprite_frames")
OUTPUT_FILE = Path("output/spritesheet.png")


def resize_with_padding(image, target_size, bg_color):
    """Resize image to fit within target_size maintaining aspect ratio, then center on background."""
    # Calculate scale to fit within target while maintaining aspect ratio
    img_width, img_height = image.size
    scale = min(target_size / img_width, target_size / img_height)
    new_width = int(img_width * scale)
    new_height = int(img_height * scale)

    # Resize maintaining aspect ratio
    resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Create background and center the image
    bg = Image.new("RGBA", (target_size, target_size), bg_color + (255,))
    x_offset = (target_size - new_width) // 2
    y_offset = (target_size - new_height) // 2
    bg.paste(resized, (x_offset, y_offset), resized if resized.mode == "RGBA" else None)

    return bg


def main():
    # Get animation folders sorted alphabetically
    animation_folders = sorted([d for d in INPUT_DIR.iterdir() if d.is_dir()])

    if not animation_folders:
        print(f"No animation folders found in {INPUT_DIR}")
        return

    print(f"Found {len(animation_folders)} animations: {[f.name for f in animation_folders]}")

    # Load all frames and find max frame count
    animations = {}
    max_frames = 0

    for folder in animation_folders:
        frames = sorted(folder.glob("frame_*.png"))
        animations[folder.name] = frames
        max_frames = max(max_frames, len(frames))
        print(f"  {folder.name}: {len(frames)} frames")

    if max_frames == 0:
        print("No frames found in any animation folder")
        return

    # Create sprite sheet canvas
    num_animations = len(animation_folders)
    sheet_width = FRAME_SIZE * max_frames
    sheet_height = FRAME_SIZE * num_animations

    print(f"\nCreating sprite sheet: {sheet_width}x{sheet_height} ({max_frames} columns x {num_animations} rows)")

    spritesheet = Image.new("RGB", (sheet_width, sheet_height), BACKGROUND_COLOR)

    # Paste frames at calculated positions
    for row, folder in enumerate(animation_folders):
        frames = animations[folder.name]
        for col, frame_path in enumerate(frames):
            # Load frame
            frame = Image.open(frame_path)

            # Use aspect-ratio-preserving resize for hatching animation
            if folder.name == "hatching":
                frame_resized = resize_with_padding(frame, FRAME_SIZE, BACKGROUND_COLOR)
            else:
                frame_resized = frame.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)

            # Convert to RGB if necessary (handles RGBA)
            if frame_resized.mode == "RGBA":
                # Create white background and paste with alpha
                bg = Image.new("RGB", (FRAME_SIZE, FRAME_SIZE), BACKGROUND_COLOR)
                bg.paste(frame_resized, mask=frame_resized.split()[3])
                frame_resized = bg
            elif frame_resized.mode != "RGB":
                frame_resized = frame_resized.convert("RGB")

            # Calculate position and paste
            x = col * FRAME_SIZE
            y = row * FRAME_SIZE
            spritesheet.paste(frame_resized, (x, y))

    # Save sprite sheet
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    spritesheet.save(OUTPUT_FILE)
    print(f"\nSaved sprite sheet to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
