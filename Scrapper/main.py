from azlyrics_scraper import get_artist_songs, scrape_lyrics_by_url
import time
import os
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

        if lyrics.startswith("Failed") or lyrics == "Lyrics not found on page":
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

    total_songs = 0

    for artist in artists:
        print(f"\nScraping artist: {artist}")
        songs_scraped = scrape_artist(artist, genre, max_songs_per_artist)
        total_songs += songs_scraped

        progress["artists_completed"] += 1
        progress["songs_scraped"] += songs_scraped
        save_progress()

        # Be extra nice between artists
        time.sleep(5)

    print(f"\nFinished scraping for genre: {genre}")
    print(f"Total artists processed: {progress['artists_completed']}")
    print(f"Total songs scraped: {progress['songs_scraped']}")

    return progress

def main():
    # Create base directory
    ensure_directory("lyrics_data")

    # Ask user what to scrape
    print("AZLyrics Genre Scraper")
    print("1. Scrape a specific artist")
    print("2. Scrape a specific genre")
    print("3. Scrape all genres")
    choice = input("Enter your choice (1, 2, or 3): ")

    if choice == "1":
        artist = input("Enter artist name: ")
        genre = input("Enter genre (hiphop, rnb, pop, country, jazz, african, latin): ")
        max_songs = int(input("Maximum number of songs to scrape (1-20): "))

        scrape_artist(artist, genre, max_songs)

    elif choice == "2":
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

    elif choice == "3":
        max_artists = int(input("Maximum number of artists per genre (1-20): "))
        max_songs = int(input("Maximum number of songs per artist (1-20): "))

        for genre in genre_artists.keys():
            print(f"\n{'='*50}")
            print(f"STARTING GENRE: {genre.upper()}")
            print(f"{'='*50}")

            scrape_genre(genre, max_artists, max_songs)

            # Be very nice between genres
            time.sleep(10)

        print("\nAll genres have been scraped!")

    else:
        print("Invalid choice. Please run the script again.")

if __name__ == "__main__":
    main()