# AI Lyrics Writer Training

**IMPORTANT: PRIVATE REPOSITORY - DO NOT SHARE PUBLICLY**

This folder contains scripts and data for training the AI lyrics writers. Due to copyright and legal considerations, this content should not be shared publicly.

## Contents

- Training scripts for genre-specific AI writers
- Data processing utilities
- Model evaluation tools

## Setup

1. Install required dependencies:
```
pip install transformers datasets torch tqdm
```

2. Organize your lyrics data in the following structure:
```
lyrics/
  ├── african/
  │   ├── artist1/
  │   │   ├── song1.txt
  │   │   ├── song2.txt
  │   ├── artist2/
  │   │   ├── song1.txt
  ├── hiphop/
  │   ├── artist1/
  │   │   ├── song1.txt
  ...
```

3. Run the training script for each genre:
```
python train_lyrics_writer.py --genre african
```

## Legal Notice

The lyrics data used for training must be obtained legally. Web scraping may violate terms of service of websites and potentially copyright laws. Always ensure you have proper permissions or licenses for any data used in training.

## Security

- Do not commit training data to public repositories
- Keep API keys and credentials secure
- Encrypt sensitive files when necessary

## Integration

After training, models should be placed in the appropriate directory for the main application to access them.
