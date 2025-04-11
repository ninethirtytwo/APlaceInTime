import requests
from bs4 import BeautifulSoup
import time
import re

def get_artist_songs(artist):
    """Get a list of all songs by an artist from AZLyrics"""
    # Format artist name for URL
    artist_formatted = artist.lower().replace(" ", "")
    # Remove special characters
    artist_formatted = ''.join(c for c in artist_formatted if c.isalnum())

    # Handle special cases
    if artist.lower() == "her":
        artist_formatted = "her"
    elif artist.lower() == "6lack":
        artist_formatted = "6lack"
    elif artist.lower() == "dan + shay":
        artist_formatted = "danshay"

    # Try different URL formats
    urls_to_try = [
        f"https://www.azlyrics.com/{artist_formatted[0]}/{artist_formatted}.html",  # Standard format
        f"https://www.azlyrics.com/19/{artist_formatted}.html"  # For artists starting with numbers
    ]

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    song_links = []

    for url in urls_to_try:
        try:
            print(f"Trying URL: {url}")
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

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

                # If we found songs, no need to try other URLs
                if song_links:
                    break
        except Exception as e:
            print(f"Error trying {url}: {str(e)}")
            continue

    return song_links

def scrape_lyrics_by_url(url):
    """Scrape lyrics from a specific AZLyrics URL"""
    # Add delay to respect the site's terms
    time.sleep(2)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return f"Failed to fetch lyrics: Status code {response.status_code}"

        soup = BeautifulSoup(response.text, 'html.parser')

        # Method 1: Find the lyrics div (it's typically a div with no class/id after the comment)
        lyrics_div = None

        # Try to find the div that contains the lyrics
        # First try: Look for the div with class 'ringtone' and get the next div
        ringtone_div = soup.find('div', class_='ringtone')
        if ringtone_div:
            lyrics_div = ringtone_div.find_next('div')

        # Second try: Look for divs without class or id that have substantial text
        if not lyrics_div or not lyrics_div.get_text().strip():
            for div in soup.find_all("div"):
                if div.get_text().strip() and not div.get('class') and not div.get('id'):
                    text = div.get_text().strip()
                    if len(text.split('\n')) > 5:  # Likely lyrics if multiple lines
                        lyrics_div = div
                        break

        # Third try: Look for the main content div
        if not lyrics_div or not lyrics_div.get_text().strip():
            main_div = soup.find('div', class_='main-page')
            if main_div:
                content_div = main_div.find('div', class_='col-xs-12 col-lg-8 text-center')
                if content_div:
                    # Find all divs without class or id
                    for div in content_div.find_all('div'):
                        if not div.get('class') and not div.get('id') and div.get_text().strip():
                            lyrics_div = div
                            break

        if not lyrics_div or not lyrics_div.get_text().strip():
            return "Lyrics not found on page"

        lyrics = lyrics_div.get_text().strip()

        # Clean up the lyrics
        # Remove any script or comment text that might be included
        lyrics = '\n'.join([line for line in lyrics.split('\n') if line.strip() and not line.strip().startswith('//')])

        return lyrics
    except Exception as e:
        return f"Error scraping lyrics: {str(e)}"