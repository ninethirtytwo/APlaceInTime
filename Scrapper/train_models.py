import os
import json
import argparse
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import GPT2Tokenizer, GPT2LMHeadModel, GPT2Config
from transformers import AdamW, get_linear_schedule_with_warmup
from tqdm import tqdm
import numpy as np
import random

# Set random seeds for reproducibility
def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

# Custom dataset for lyrics
class LyricsDataset(Dataset):
    def __init__(self, data_dir, tokenizer, max_length=512):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.examples = []
        
        # Load all JSON files in the directory
        for filename in os.listdir(data_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(data_dir, filename)
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Format the text with metadata
                    text = f"Title: {data['metadata']['title']}\nArtist: {data['metadata']['artist']}\n\nLyrics:\n{data['lyrics']}"
                    self.examples.append(text)
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        text = self.examples[idx]
        
        # Tokenize the text
        encodings = self.tokenizer(text, 
                                  truncation=True, 
                                  max_length=self.max_length, 
                                  padding="max_length",
                                  return_tensors="pt")
        
        # Create labels (same as input_ids for language modeling)
        input_ids = encodings.input_ids.squeeze()
        attention_mask = encodings.attention_mask.squeeze()
        labels = input_ids.clone()
        
        # Mask out padding tokens in labels
        labels[labels == self.tokenizer.pad_token_id] = -100
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels
        }

def train_genre_model(genre, data_dir, output_dir, epochs=3, batch_size=4, learning_rate=5e-5):
    """Train a model for a specific genre"""
    print(f"Training model for {genre} genre...")
    
    # Create output directory
    model_dir = os.path.join(output_dir, genre)
    os.makedirs(model_dir, exist_ok=True)
    
    # Initialize tokenizer and model
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token
    
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    model.resize_token_embeddings(len(tokenizer))
    
    # Prepare dataset and dataloader
    train_dir = os.path.join(data_dir, "train", genre)
    val_dir = os.path.join(data_dir, "val", genre)
    
    train_dataset = LyricsDataset(train_dir, tokenizer)
    val_dataset = LyricsDataset(val_dir, tokenizer)
    
    train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_dataloader = DataLoader(val_dataset, batch_size=batch_size)
    
    # Set up optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=learning_rate)
    total_steps = len(train_dataloader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer, 
        num_warmup_steps=0, 
        num_training_steps=total_steps
    )
    
    # Check if GPU is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    
    # Training loop
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        print(f"Epoch {epoch+1}/{epochs}")
        
        # Training
        model.train()
        train_loss = 0
        
        for batch in tqdm(train_dataloader, desc="Training"):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            # Forward pass
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            train_loss += loss.item()
            
            # Backward pass
            loss.backward()
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
        
        avg_train_loss = train_loss / len(train_dataloader)
        print(f"Average training loss: {avg_train_loss}")
        
        # Validation
        model.eval()
        val_loss = 0
        
        with torch.no_grad():
            for batch in tqdm(val_dataloader, desc="Validation"):
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                
                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                loss = outputs.loss
                val_loss += loss.item()
        
        avg_val_loss = val_loss / len(val_dataloader)
        print(f"Average validation loss: {avg_val_loss}")
        
        # Save model if it's the best so far
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            print(f"Saving best model with validation loss: {best_val_loss}")
            model.save_pretrained(model_dir)
            tokenizer.save_pretrained(model_dir)
    
    print(f"Training complete for {genre} genre!")
    return model_dir

def main():
    parser = argparse.ArgumentParser(description="Train genre-specific lyrics generation models")
    parser.add_argument("--data_dir", type=str, default="processed_lyrics_data", help="Directory with processed lyrics data")
    parser.add_argument("--output_dir", type=str, default="trained_models", help="Directory to save trained models")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=4, help="Training batch size")
    parser.add_argument("--learning_rate", type=float, default=5e-5, help="Learning rate")
    parser.add_argument("--genre", type=str, help="Specific genre to train (if not specified, train all genres)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    
    args = parser.parse_args()
    
    # Set random seed
    set_seed(args.seed)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Get list of genres
    if args.genre:
        genres = [args.genre]
    else:
        genres = [d for d in os.listdir(os.path.join(args.data_dir, "train")) 
                 if os.path.isdir(os.path.join(args.data_dir, "train", d))]
    
    # Train models for each genre
    for genre in genres:
        train_genre_model(
            genre=genre,
            data_dir=args.data_dir,
            output_dir=args.output_dir,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate
        )
    
    print("All models trained successfully!")

if __name__ == "__main__":
    main()
