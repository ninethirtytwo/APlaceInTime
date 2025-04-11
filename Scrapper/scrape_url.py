from azlyrics_scraper import scrape_lyrics_by_url
import os
import time
import re
from bs4 import BeautifulSoup
import requests

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

def get_songs_from_url(url):
    """Get songs from a specific artist URL"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        song_links = []
        
        # Find the album and song list divs
        album_divs = soup.find_all("div", class_="album")
        for div in album_divs:
            # Find all song links
            list_div = div.find_next_sibling("div", class_="listalbum-item")
            if list_div:
                links = list_div.find_all("a")
                for link in links:
                    if link.get('href') and '/lyrics/' in link.get('href'):
                        song_title = link.text.strip()
                        song_url = 'https://www.azlyrics.com' + link.get('href')
                        song_links.append((song_title, song_url))
        
        return song_links
    except Exception as e:
        print(f"Error getting songs from URL: {str(e)}")
        return []

def scrape_artist_from_url(url, artist_name, genre, max_songs=10):
    """Scrape lyrics for a specific artist from a URL"""
    print(f"Finding songs for {artist_name} from URL: {url}")
    songs = get_songs_from_url(url)
    
    if not songs:
        print(f"No songs found for artist '{artist_name}' at the provided URL.")
        return 0
    
    print(f"Found {len(songs)} songs by {artist_name}.")
    print(f"Starting to scrape lyrics for {min(len(songs), max_songs)} songs...")
    
    songs_scraped = 0
    
    for i, (song_title, song_url) in enumerate(songs[:max_songs]):
        print(f"[{i+1}/{min(len(songs), max_songs)}] Scraping lyrics for '{song_title}'...")
        lyrics = scrape_lyrics_by_url(song_url)
        
        if lyrics.startswith("Failed") or lyrics == "Lyrics not found on page" or lyrics.startswith("Error"):
            print(f"  Error: {lyrics}")
            continue
        
        # Save lyrics to file
        file_path = save_lyrics_to_file(artist_name, song_title, lyrics, genre)
        print(f"  Saved to: {file_path}")
        songs_scraped += 1
        
        # Be nice to the server
        time.sleep(3)
    
    print(f"Finished saving {songs_scraped} songs by {artist_name}.")
    return songs_scraped

if __name__ == "__main__":
    # Create base directory
    ensure_directory("lyrics_data")
    
    # Get URL, artist name, and genre
    url = input("Enter artist URL from AZLyrics: ")
    artist_name = input("Enter artist name: ")
    genre = input("Enter genre (hiphop, rnb, pop, country, jazz, african, latin): ")
    max_songs = int(input("Maximum number of songs to scrape (1-20): "))
    
    # Scrape the artist
    scrape_artist_from_url(url, artist_name, genre, max_songs)
