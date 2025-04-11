import os
import sys

def check_files():
    print("Checking files in current directory...")
    files = os.listdir('.')
    print(f"Files found: {files}")

    required_files = ['azlyrics_scraper.py', 'main.py']
    for file in required_files:
        if file in files:
            print(f"✓ {file} found")
        else:
            print(f"✗ {file} NOT found")

    # Check if files have .txt extension by mistake
    for file in files:
        if file.endswith('.py.txt'):
            print(f"Warning: {file} has .txt extension. Rename it to remove .txt")

    # Check if lyrics_data directory exists, create if not
    if not os.path.exists('lyrics_data'):
        print("Creating lyrics_data directory...")
        os.makedirs('lyrics_data')
        print("✓ lyrics_data directory created")
    else:
        print("✓ lyrics_data directory exists")

def test_imports():
    print("\nTesting imports...")
    try:
        import requests
        print("✓ requests module imported")
    except ImportError:
        print("✗ requests module not found")
        print("  Run: pip install requests")

    try:
        from bs4 import BeautifulSoup
        print("✓ BeautifulSoup imported")
    except ImportError:
        print("✗ BeautifulSoup not found")
        print("  Run: pip install beautifulsoup4")

    try:
        import json
        print("✓ json module imported (built-in)")
    except ImportError:
        print("✗ json module not found (should be built-in)")

def test_azlyrics():
    print("\nTesting AZLyrics scraper...")
    try:
        from azlyrics_scraper import get_artist_songs, scrape_lyrics_by_url
        print("✓ Successfully imported scraper functions")

        # Test with a popular artist
        test_artist = 'Adele'
        print(f"Testing with artist '{test_artist}'...")
        songs = get_artist_songs(test_artist)
        if songs:
            print(f"✓ Found {len(songs)} songs for {test_artist}")
            print(f"First song: {songs[0][0]}")

            # Test lyrics scraping for the first song
            print(f"Testing lyrics scraping for '{songs[0][0]}'...")
            lyrics = scrape_lyrics_by_url(songs[0][1])
            if lyrics and not lyrics.startswith("Failed") and not lyrics.startswith("Error"):
                # Print first few lines of lyrics
                lyrics_preview = '\n'.join(lyrics.split('\n')[:5]) + '\n...'
                print(f"✓ Successfully scraped lyrics:\n{lyrics_preview}")
            else:
                print(f"✗ Failed to scrape lyrics: {lyrics}")
        else:
            print(f"✗ No songs found for {test_artist}")

            # Try another artist
            test_artist = 'Taylor Swift'
            print(f"Trying with artist '{test_artist}'...")
            songs = get_artist_songs(test_artist)
            if songs:
                print(f"✓ Found {len(songs)} songs for {test_artist}")
            else:
                print(f"✗ No songs found for {test_artist} either. Check your internet connection or AZLyrics might be blocking requests.")
    except Exception as e:
        print(f"✗ Error testing AZLyrics scraper: {str(e)}")

if __name__ == "__main__":
    print("=== Diagnostic Test ===")
    check_files()
    test_imports()
    test_azlyrics()
    print("\nIf you see any errors above, fix them before running main.py")