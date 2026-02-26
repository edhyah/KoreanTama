"""Check the status of a Sora video generation job."""

import sys
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if len(sys.argv) < 2:
    print("Usage: uv run check_status.py <video_id>")
    sys.exit(1)

video_id = sys.argv[1]

job = client.videos.retrieve(video_id)
print(f"Video ID: {video_id}")
print(f"Status:   {job.status}")
print(f"Progress: {getattr(job, 'progress', 'N/A')}%")
