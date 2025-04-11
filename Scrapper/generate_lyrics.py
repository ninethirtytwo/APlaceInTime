import os
import argparse
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel

def load_model(model_dir):
    """Load a trained model and tokenizer"""
    tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    return model, tokenizer

def generate_lyrics(model, tokenizer, prompt, max_length=200, temperature=1.0, top_k=50, top_p=0.95, num_return_sequences=1):
    """Generate lyrics using the trained model"""
    # Encode the prompt
    input_ids = tokenizer.encode(prompt, return_tensors="pt")
    
    # Check if GPU is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    input_ids = input_ids.to(device)
    
    # Generate text
    output = model.generate(
        input_ids,
        max_length=max_length,
        temperature=temperature,
        top_k=top_k,
        top_p=top_p,
        num_return_sequences=num_return_sequences,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )
    
    # Decode the generated text
    generated_texts = []
    for i, generated_sequence in enumerate(output):
        text = tokenizer.decode(generated_sequence, skip_special_tokens=True)
        generated_texts.append(text)
    
    return generated_texts

def main():
    parser = argparse.ArgumentParser(description="Generate lyrics using trained models")
    parser.add_argument("--models_dir", type=str, default="trained_models", help="Directory with trained models")
    parser.add_argument("--genre", type=str, required=True, help="Genre to use for generation")
    parser.add_argument("--prompt", type=str, required=True, help="Prompt to start generation")
    parser.add_argument("--max_length", type=int, default=200, help="Maximum length of generated text")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature for sampling")
    parser.add_argument("--top_k", type=int, default=50, help="Top-k sampling parameter")
    parser.add_argument("--top_p", type=float, default=0.95, help="Top-p sampling parameter")
    parser.add_argument("--num_sequences", type=int, default=1, help="Number of sequences to generate")
    
    args = parser.parse_args()
    
    # Load the model for the specified genre
    model_dir = os.path.join(args.models_dir, args.genre)
    if not os.path.exists(model_dir):
        print(f"No trained model found for genre: {args.genre}")
        print(f"Available genres: {os.listdir(args.models_dir)}")
        return
    
    model, tokenizer = load_model(model_dir)
    
    # Generate lyrics
    generated_texts = generate_lyrics(
        model=model,
        tokenizer=tokenizer,
        prompt=args.prompt,
        max_length=args.max_length,
        temperature=args.temperature,
        top_k=args.top_k,
        top_p=args.top_p,
        num_return_sequences=args.num_sequences
    )
    
    # Print the generated lyrics
    print(f"\nGenerated lyrics for genre: {args.genre}")
    print("=" * 50)
    for i, text in enumerate(generated_texts):
        print(f"Sequence {i+1}:")
        print(text)
        print("-" * 50)

if __name__ == "__main__":
    main()
