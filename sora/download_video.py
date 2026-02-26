"""Download a completed Sora video."""

import sys
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if len(sys.argv) < 2:
    print("Usage: uv run download_video.py <video_id>")
    sys.exit(1)

video_id = sys.argv[1]
output_dir = "output"
os.makedirs(output_dir, exist_ok=True)

for variant in ["video", "thumbnail", "spritesheet"]:
    try:
        print(f"Downloading {variant}...")
        resp = client.videos.download_content(video_id=video_id, variant=variant)
        ext = "mp4" if variant == "video" else "png"  # thumbnail and spritesheet are both png
        filepath = f"{output_dir}/{video_id}_{variant}.{ext}"
        with open(filepath, "wb") as f:
            f.write(resp.read())
        print(f"  Saved: {filepath}")
    except Exception as e:
        print(f"  Failed: {e}")
