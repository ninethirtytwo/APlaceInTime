from azlyrics_scraper import get_artist_songs, scrape_lyrics_by_url
import os
import time
import json

# Define top artists by genre (matching your AI writers)
genre_artists = {
    "hiphop": [
        "kendrick lamar", "j cole", "drake", "tyler the creator", "kanye west",
        "travis scott", "asap rocky", "eminem", "lil wayne", "jay z",
        "megan thee stallion", "cardi b", "nicki minaj", "future", "21 savage",
        "post malone", "jack harlow", "lil baby", "lil durk", "gunna"
    ],
    "rnb": [
        "the weeknd", "sza", "frank ocean", "daniel caesar", "her",
        "summer walker", "bryson tiller", "chris brown", "usher", "jhene aiko",
        "kehlani", "brent faiyaz", "lucky daye", "giveon", "ella mai",
        "jorja smith", "doja cat", "khalid", "6lack", "ari lennox"
    ],
    "pop": [
        "taylor swift", "ed sheeran", "ariana grande", "justin bieber", "billie eilish",
        "harry styles", "dua lipa", "the kid laroi", "olivia rodrigo", "post malone",
        "shawn mendes", "camila cabello", "charlie puth", "halsey", "selena gomez",
        "bruno mars", "adele", "sam smith", "lizzo", "lil nas x"
    ],
    "country": [
        "luke combs", "morgan wallen", "kane brown", "chris stapleton", "carrie underwood",
        "luke bryan", "thomas rhett", "kelsea ballerini", "dan + shay", "miranda lambert",
        "blake shelton", "keith urban", "jason aldean", "maren morris", "zac brown band",
        "florida georgia line", "tim mcgraw", "kenny chesney", "dierks bentley", "eric church"
    ],
    "jazz": [
        "kamasi washington", "robert glasper", "esperanza spalding", "christian scott", "cory henry",
        "jacob collier", "snarky puppy", "thundercat", "gregory porter", "norah jones",
        "kurt elling", "cecile mclorin salvant", "brad mehldau", "ambrose akinmusire", "vijay iyer",
        "chris potter", "christian mcbride", "joey alexander", "makaya mccraven", "terrace martin"
    ],
    "african": [
        "burna boy", "wizkid", "davido", "tems", "ckay",
        "fireboy dml", "rema", "tiwa savage", "black coffee", "amaarae",
        "black sherif", "omah lay", "joeboy", "ayra starr", "asake",
        "diamond platnumz", "fally ipupa", "angelique kidjo", "nasty c", "sarkodie"
    ],
    "latin": [
        "bad bunny", "j balvin", "karol g", "ozuna", "rauw alejandro",
        "daddy yankee", "maluma", "anuel aa", "becky g", "rosalia",
        "nicky jam", "farruko", "sech", "myke towers", "jhay cortez",
        "luis fonsi", "shakira", "sebastian yatra", "camilo", "natti natasha"
    ]
}

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
    clean_title = song_title.replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace("?", "_").replace("\"", "_").replace("<", "_").replace(">", "_").replace("|", "_")
    
    # Save to file
    file_path = os.path.join(artist_dir, f"{clean_title}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(lyrics)
    
    return file_path

def scrape_genre(genre, max_artists=20, max_songs_per_artist=10):
    """Scrape lyrics for a specific genre"""
    if genre not in genre_artists:
        print(f"Genre '{genre}' not found in the database.")
        return
    
    artists = genre_artists[genre][:max_artists]
    print(f"Starting to scrape {len(artists)} artists for genre: {genre}")
    
    # Create base directory for genre
    base_dir = os.path.join("lyrics_data", genre)
    ensure_directory(base_dir)
    
    # Track progress
    progress = {
        "genre": genre,
        "artists_completed": 0,
        "songs_scraped": 0,
        "errors": []
    }
    
    # Save progress function
    def save_progress():
        with open(os.path.join(base_dir, "progress.json"), "w") as f:
            json.dump(progress, f, indent=2)
    
    for artist in artists:
        print(f"\nScraping artist: {artist}")
        songs = get_artist_songs(artist)
        
        if not songs:
            print(f"No songs found for artist '{artist}' or artist page not found.")
            progress["errors"].append(f"No songs found for {artist}")
            save_progress()
            continue
        
        print(f"Found {len(songs)} songs by {artist}. Will scrape up to {max_songs_per_artist}.")
        
        # Limit songs to scrape
        songs_to_scrape = songs[:max_songs_per_artist]
        
        for i, (song_title, song_url) in enumerate(songs_to_scrape):
            print(f"[{i+1}/{len(songs_to_scrape)}] Scraping lyrics for '{song_title}'...")
            lyrics = scrape_lyrics_by_url(song_url)
            
            if lyrics.startswith("Failed") or lyrics == "Lyrics not found on page":
                print(f"  Error: {lyrics}")
                progress["errors"].append(f"Error with {artist} - {song_title}: {lyrics}")
                continue
            
            # Save lyrics to file
            file_path = save_lyrics_to_file(artist, song_title, lyrics, genre)
            print(f"  Saved to: {file_path}")
            progress["songs_scraped"] += 1
            
            # Be nice to the server
            time.sleep(3)
        
        progress["artists_completed"] += 1
        save_progress()
        
        # Be extra nice between artists
        time.sleep(5)
    
    print(f"\nFinished scraping for genre: {genre}")
    print(f"Total artists processed: {progress['artists_completed']}")
    print(f"Total songs scraped: {progress['songs_scraped']}")
    print(f"Total errors: {len(progress['errors'])}")
    
    return progress

def scrape_all_genres(max_artists_per_genre=5, max_songs_per_artist=5):
    """Scrape lyrics for all genres"""
    overall_progress = {}
    
    for genre in genre_artists.keys():
        print(f"\n{'='*50}")
        print(f"STARTING GENRE: {genre.upper()}")
        print(f"{'='*50}")
        
        progress = scrape_genre(genre, max_artists_per_genre, max_songs_per_artist)
        overall_progress[genre] = progress
        
        # Save overall progress
        with open("overall_progress.json", "w") as f:
            json.dump(overall_progress, f, indent=2)
        
        # Be very nice between genres
        time.sleep(10)
    
    print("\nAll genres have been scraped!")
    return overall_progress

if __name__ == "__main__":
    # Create base directory
    ensure_directory("lyrics_data")
    
    # Ask user what to scrape
    print("AZLyrics Genre Scraper")
    print("1. Scrape a specific genre")
    print("2. Scrape all genres")
    choice = input("Enter your choice (1 or 2): ")
    
    if choice == "1":
        print("\nAvailable genres:")
        for i, genre in enumerate(genre_artists.keys(), 1):
            print(f"{i}. {genre}")
        
        genre_choice = input("Enter genre number: ")
        try:
            genre_index = int(genre_choice) - 1
            genre = list(genre_artists.keys())[genre_index]
            
            max_artists = int(input("Maximum number of artists to scrape (1-20): "))
            max_songs = int(input("Maximum number of songs per artist (1-20): "))
            
            scrape_genre(genre, max_artists, max_songs)
        except (ValueError, IndexError):
            print("Invalid input. Please run the script again.")
    
    elif choice == "2":
        max_artists = int(input("Maximum number of artists per genre (1-20): "))
        max_songs = int(input("Maximum number of songs per artist (1-20): "))
        
        scrape_all_genres(max_artists, max_songs)
    
    else:
        print("Invalid choice. Please run the script again.")
