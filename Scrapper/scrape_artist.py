from azlyrics_scraper import get_artist_songs, scrape_lyrics_by_url
import os
import time

def ensure_directory(path):
    """Create directory if it doesn't exist"""
    if not os.path.exists(path):
        os.makedirs(path)

def save_lyrics_to_file(artist, song_title, lyrics, genre):
    """Save lyrics to a local file organized by genre and artist"""
    # Create directories
    base_dir = os.path.join("lyrics_data", genre)
    artist_dir = os.path.join(base_dir, artist.replace(" ", "_"))
    ensure_directory(artist_dir)
    
    # Clean song title for filename
    clean_title = song_title.replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace("?", "_").replace('"', "_").replace("<", "_").replace(">", "_").replace("|", "_")
    
    # Save to file
    file_path = os.path.join(artist_dir, f"{clean_title}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(lyrics)
    
    return file_path

def scrape_artist(artist, genre, max_songs=10):
    """Scrape lyrics for a specific artist"""
    print(f"Finding songs by {artist}...")
    songs = get_artist_songs(artist)
    
    if not songs:
        print(f"No songs found for artist '{artist}' or artist page not found.")
        return 0
    
    print(f"Found {len(songs)} songs by {artist}.")
    print(f"Starting to scrape lyrics for {min(len(songs), max_songs)} songs...")
    
    songs_scraped = 0
    
    for i, (song_title, song_url) in enumerate(songs[:max_songs]):
        print(f"[{i+1}/{min(len(songs), max_songs)}] Scraping lyrics for '{song_title}'...")
        lyrics = scrape_lyrics_by_url(song_url)
        
        if lyrics.startswith("Failed") or lyrics == "Lyrics not found on page" or lyrics.startswith("Error"):
            print(f"  Error: {lyrics}")
            continue
        
        # Save lyrics to file
        file_path = save_lyrics_to_file(artist, song_title, lyrics, genre)
        print(f"  Saved to: {file_path}")
        songs_scraped += 1
        
        # Be nice to the server
        time.sleep(3)
    
    print(f"Finished saving {songs_scraped} songs by {artist}.")
    return songs_scraped

if __name__ == "__main__":
    # Create base directory
    ensure_directory("lyrics_data")
    
    # Get artist and genre
    artist = input("Enter artist name: ")
    genre = input("Enter genre (hiphop, rnb, pop, country, jazz, african, latin): ")
    max_songs = int(input("Maximum number of songs to scrape (1-20): "))
    
    # Scrape the artist
    scrape_artist(artist, genre, max_songs)
