# AI Lyrics Generation System

This system collects lyrics data from various artists across different genres and trains AI models to generate new lyrics in the style of each genre. The system is organized around genre-specific "AI writers" who specialize in different musical styles.

## AI Writers

1. **Elias Fontaine** - Hip-Hop/Rap
2. **Luna Rivers** - R&B and Soul
3. **Jay Carter** - Pop
4. **Max "Sly" Dawson** - Country
5. **Zane Mercer** - Jazz
6. **Nova Sinclair** - Global African
7. **Rico Vega** - Latin/Caribbean

## System Components

### 1. Data Collection

The system includes scripts to scrape lyrics from AZLyrics:

- `scrape_artist.py` - Scrape lyrics for a specific artist
- `scrape_url.py` - Scrape lyrics from a specific AZLyrics URL

Usage:
```
python scrape_artist.py
```

or

```
python scrape_url.py
```

Follow the prompts to enter the artist name, genre, and number of songs to scrape.

### 2. Data Preprocessing

The `preprocess_lyrics.py` script cleans and organizes the collected lyrics data:

- Removes section tags like [Verse], [Chorus], etc.
- Normalizes text
- Splits data into training, validation, and test sets
- Converts data to JSON format with metadata

Usage:
```
python preprocess_lyrics.py
```

### 3. Model Training

The `train_models.py` script trains genre-specific language models:

- Uses GPT-2 as the base model
- Fine-tunes on genre-specific lyrics
- Saves models for each genre

Usage:
```
python train_models.py --genre hiphop --epochs 5
```

Options:
- `--data_dir`: Directory with processed lyrics data (default: "processed_lyrics_data")
- `--output_dir`: Directory to save trained models (default: "trained_models")
- `--epochs`: Number of training epochs (default: 3)
- `--batch_size`: Training batch size (default: 4)
- `--learning_rate`: Learning rate (default: 5e-5)
- `--genre`: Specific genre to train (if not specified, train all genres)
- `--seed`: Random seed for reproducibility (default: 42)

### 4. Lyrics Generation

The `generate_lyrics.py` script generates new lyrics using the trained models:

Usage:
```
python generate_lyrics.py --genre hiphop --prompt "Title: My New Song\nArtist: AI Writer\n\nLyrics:\n"
```

Options:
- `--models_dir`: Directory with trained models (default: "trained_models")
- `--genre`: Genre to use for generation (required)
- `--prompt`: Prompt to start generation (required)
- `--max_length`: Maximum length of generated text (default: 200)
- `--temperature`: Temperature for sampling (default: 1.0)
- `--top_k`: Top-k sampling parameter (default: 50)
- `--top_p`: Top-p sampling parameter (default: 0.95)
- `--num_sequences`: Number of sequences to generate (default: 1)

### 5. Model Evaluation

The `evaluate_models.py` script evaluates the trained models:

- Calculates perplexity on test data
- Generates sample lyrics
- Saves evaluation results

Usage:
```
python evaluate_models.py --genre hiphop
```

Options:
- `--models_dir`: Directory with trained models (default: "trained_models")
- `--data_dir`: Directory with processed lyrics data (default: "processed_lyrics_data")
- `--batch_size`: Batch size for evaluation (default: 4)
- `--genre`: Specific genre to evaluate (if not specified, evaluate all genres)
- `--output`: Output file for evaluation results (default: "evaluation_results.json")

### 6. API Integration

The `api.py` script provides a REST API for integrating the models with your application:

- `/api/generate` - Generate lyrics for a specific genre
- `/api/writers` - Get information about all available writers
- `/api/collaborative` - Generate lyrics collaboratively with multiple genre specialists

Usage:
```
python api.py
```

Then make API requests to `http://localhost:5000/api/generate` with JSON data:
```json
{
  "genre": "hiphop",
  "prompt": "Title: My New Song\nArtist: AI Writer\n\nLyrics:\n",
  "max_length": 200,
  "temperature": 1.0
}
```

## Installation Requirements

```
pip install torch transformers flask tqdm numpy
```

## Workflow

1. Collect lyrics data using the scraping scripts
2. Preprocess the data with `preprocess_lyrics.py`
3. Train models for each genre with `train_models.py`
4. Evaluate the models with `evaluate_models.py`
5. Generate lyrics with `generate_lyrics.py` or through the API

## Notes

- The system requires a GPU for efficient training, but can run on CPU for inference
- Training time depends on the amount of data and number of epochs
- The quality of generated lyrics improves with more training data
