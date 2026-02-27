#!/bin/bash

# Directory containing videos
INPUT_DIR="/Users/edwardahn/workspace/KoreanTama/sora/output"
# Directory to save frames (inside output folder)
FRAMES_DIR="/Users/edwardahn/workspace/KoreanTama/sora/output/frames"

# Create frames directory if it doesn't exist
mkdir -p "$FRAMES_DIR"

# Loop through each mp4 file
for video in "$INPUT_DIR"/*.mp4; do
    # Get the base name without extension
    name=$(basename "$video" .mp4)

    # Create subdirectory for this video's frames
    mkdir -p "$FRAMES_DIR/$name"

    # Extract frames using ffmpeg
    ffmpeg -i "$video" "$FRAMES_DIR/$name/frame_%04d.png"

    echo "Extracted frames from $name"
done

echo "Done! Frames saved to $FRAMES_DIR"
