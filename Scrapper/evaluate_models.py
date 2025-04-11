import os
import json
import argparse
import torch
import numpy as np
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm

class TestDataset(Dataset):
    def __init__(self, data_dir, tokenizer, max_length=512):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.examples = []
        self.metadata = []
        
        # Load all JSON files in the directory
        for filename in os.listdir(data_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(data_dir, filename)
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Store the lyrics text
                    self.examples.append(data['lyrics'])
                    
                    # Store metadata
                    self.metadata.append({
                        'title': data['metadata']['title'],
                        'artist': data['metadata']['artist'],
                        'file': file_path
                    })
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        text = self.examples[idx]
        meta = self.metadata[idx]
        
        # Tokenize the text
        encodings = self.tokenizer(text, 
                                  truncation=True, 
                                  max_length=self.max_length, 
                                  padding="max_length",
                                  return_tensors="pt")
        
        input_ids = encodings.input_ids.squeeze()
        attention_mask = encodings.attention_mask.squeeze()
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "metadata": meta
        }

def calculate_perplexity(model, dataloader, device):
    """Calculate perplexity on a dataset"""
    model.eval()
    total_loss = 0
    total_tokens = 0
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Calculating perplexity"):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            
            # Create labels (shifted input_ids)
            labels = input_ids.clone()
            
            # Forward pass
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            total_loss += loss.item() * input_ids.size(0)  # Batch loss
            total_tokens += attention_mask.sum().item()
    
    # Calculate perplexity
    avg_loss = total_loss / len(dataloader.dataset)
    perplexity = torch.exp(torch.tensor(avg_loss)).item()
    
    return perplexity

def evaluate_genre_model(genre, models_dir, data_dir, batch_size=4):
    """Evaluate a model for a specific genre"""
    print(f"Evaluating model for {genre} genre...")
    
    # Load model and tokenizer
    model_dir = os.path.join(models_dir, genre)
    if not os.path.exists(model_dir):
        print(f"No trained model found for genre: {genre}")
        return None
    
    tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    
    # Check if GPU is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    
    # Prepare test dataset
    test_dir = os.path.join(data_dir, "test", genre)
    if not os.path.exists(test_dir) or len(os.listdir(test_dir)) == 0:
        print(f"No test data found for genre: {genre}")
        return None
    
    test_dataset = TestDataset(test_dir, tokenizer)
    test_dataloader = DataLoader(test_dataset, batch_size=batch_size)
    
    # Calculate perplexity
    perplexity = calculate_perplexity(model, test_dataloader, device)
    
    print(f"Perplexity for {genre} model: {perplexity:.4f}")
    
    # Generate sample lyrics
    print("\nGenerating sample lyrics...")
    prompt = f"Title: Sample Song\nArtist: AI Writer\n\nLyrics:\n"
    
    input_ids = tokenizer.encode(prompt, return_tensors="pt").to(device)
    output = model.generate(
        input_ids,
        max_length=200,
        temperature=1.0,
        top_k=50,
        top_p=0.95,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )
    
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    print(generated_text)
    
    return {
        "genre": genre,
        "perplexity": perplexity,
        "sample": generated_text
    }

def main():
    parser = argparse.ArgumentParser(description="Evaluate trained lyrics generation models")
    parser.add_argument("--models_dir", type=str, default="trained_models", help="Directory with trained models")
    parser.add_argument("--data_dir", type=str, default="processed_lyrics_data", help="Directory with processed lyrics data")
    parser.add_argument("--batch_size", type=int, default=4, help="Batch size for evaluation")
    parser.add_argument("--genre", type=str, help="Specific genre to evaluate (if not specified, evaluate all genres)")
    parser.add_argument("--output", type=str, default="evaluation_results.json", help="Output file for evaluation results")
    
    args = parser.parse_args()
    
    # Get list of genres
    if args.genre:
        genres = [args.genre]
    else:
        genres = [d for d in os.listdir(args.models_dir) 
                 if os.path.isdir(os.path.join(args.models_dir, d))]
    
    # Evaluate models for each genre
    results = {}
    for genre in genres:
        result = evaluate_genre_model(
            genre=genre,
            models_dir=args.models_dir,
            data_dir=args.data_dir,
            batch_size=args.batch_size
        )
        if result:
            results[genre] = result
    
    # Save results to file
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"Evaluation results saved to {args.output}")

if __name__ == "__main__":
    main()
