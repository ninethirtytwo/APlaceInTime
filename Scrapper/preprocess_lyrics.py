import os
import re
import random
import json
from pathlib import Path

def clean_lyrics(text):
    """Clean lyrics text by removing headers, footers, and normalizing text"""
    # Remove common AZLyrics headers and footers
    text = re.sub(r'.*?\[.*?\].*?\n', '', text)  # Remove [Verse], [Chorus], etc.
    text = re.sub(r'.*?\(.*?\).*?\n', '', text)  # Remove (Verse), (Chorus), etc.
    
    # Remove extra whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text

def process_genre_folder(genre_path, output_dir):
    """Process all lyrics in a genre folder"""
    genre = os.path.basename(genre_path)
    print(f"Processing {genre} genre...")
    
    # Create output directories
    train_dir = os.path.join(output_dir, "train", genre)
    val_dir = os.path.join(output_dir, "val", genre)
    test_dir = os.path.join(output_dir, "test", genre)
    
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)
    
    # Get all artist folders
    artist_folders = [f for f in os.listdir(genre_path) if os.path.isdir(os.path.join(genre_path, f))]
    
    # Track statistics
    stats = {
        "genre": genre,
        "total_songs": 0,
        "total_artists": len(artist_folders),
        "artists": {},
        "train_count": 0,
        "val_count": 0,
        "test_count": 0
    }
    
    # Process each artist
    for artist_folder in artist_folders:
        artist_path = os.path.join(genre_path, artist_folder)
        artist_name = artist_folder.replace("_", " ")
        
        # Get all lyrics files
        lyric_files = [f for f in os.listdir(artist_path) if f.endswith('.txt')]
        
        # Track artist statistics
        stats["artists"][artist_name] = {
            "total_songs": len(lyric_files),
            "train_songs": 0,
            "val_songs": 0,
            "test_songs": 0
        }
        
        # Shuffle files to ensure random distribution
        random.shuffle(lyric_files)
        
        # Split into train (70%), validation (15%), test (15%)
        train_split = int(0.7 * len(lyric_files))
        val_split = int(0.85 * len(lyric_files))
        
        train_files = lyric_files[:train_split]
        val_files = lyric_files[train_split:val_split]
        test_files = lyric_files[val_split:]
        
        # Update statistics
        stats["artists"][artist_name]["train_songs"] = len(train_files)
        stats["artists"][artist_name]["val_songs"] = len(val_files)
        stats["artists"][artist_name]["test_songs"] = len(test_files)
        
        stats["train_count"] += len(train_files)
        stats["val_count"] += len(val_files)
        stats["test_count"] += len(test_files)
        stats["total_songs"] += len(lyric_files)
        
        # Process train files
        for file in train_files:
            process_file(os.path.join(artist_path, file), os.path.join(train_dir, file), artist_name)
        
        # Process validation files
        for file in val_files:
            process_file(os.path.join(artist_path, file), os.path.join(val_dir, file), artist_name)
        
        # Process test files
        for file in test_files:
            process_file(os.path.join(artist_path, file), os.path.join(test_dir, file), artist_name)
    
    return stats

def process_file(input_path, output_path, artist_name):
    """Process a single lyrics file"""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            lyrics = f.read()
        
        # Clean the lyrics
        cleaned_lyrics = clean_lyrics(lyrics)
        
        # Add metadata
        song_title = os.path.basename(input_path).replace('.txt', '')
        metadata = {
            "title": song_title,
            "artist": artist_name,
            "original_file": input_path
        }
        
        # Save as JSON with metadata and cleaned lyrics
        output_data = {
            "metadata": metadata,
            "lyrics": cleaned_lyrics
        }
        
        with open(output_path.replace('.txt', '.json'), 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")

def main():
    # Base directories
    lyrics_data_dir = "lyrics_data"
    processed_data_dir = "processed_lyrics_data"
    
    # Create output directory
    os.makedirs(processed_data_dir, exist_ok=True)
    
    # Get all genre folders
    genre_folders = [f for f in os.listdir(lyrics_data_dir) if os.path.isdir(os.path.join(lyrics_data_dir, f))]
    
    # Process each genre
    all_stats = {}
    for genre_folder in genre_folders:
        genre_path = os.path.join(lyrics_data_dir, genre_folder)
        stats = process_genre_folder(genre_path, processed_data_dir)
        all_stats[genre_folder] = stats
    
    # Save statistics
    with open(os.path.join(processed_data_dir, 'stats.json'), 'w', encoding='utf-8') as f:
        json.dump(all_stats, f, indent=2)
    
    print("Preprocessing complete!")
    print(f"Data saved to {processed_data_dir}")
    
    # Print summary
    print("\nSummary:")
    for genre, stats in all_stats.items():
        print(f"{genre}: {stats['total_songs']} songs from {stats['total_artists']} artists")
        print(f"  Train: {stats['train_count']} songs")
        print(f"  Validation: {stats['val_count']} songs")
        print(f"  Test: {stats['test_count']} songs")
        print()

if __name__ == "__main__":
    main()
