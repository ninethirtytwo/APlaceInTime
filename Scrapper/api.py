from flask import Flask, request, jsonify
import os
import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel
import random

app = Flask(__name__)

# Dictionary to map genres to writer names
GENRE_TO_WRITER = {
    "hiphop": "Elias Fontaine",
    "rnb": "Luna Rivers",
    "pop": "Jay Carter",
    "country": "Max 'Sly' Dawson",
    "jazz": "Zane Mercer",
    "african": "Nova Sinclair",
    "latin": "Rico Vega"
}

# Dictionary to store loaded models
loaded_models = {}

def load_model(genre):
    """Load a model for a specific genre if not already loaded"""
    if genre not in loaded_models:
        model_dir = os.path.join("trained_models", genre)
        if not os.path.exists(model_dir):
            return None, None
        
        tokenizer = GPT2Tokenizer.from_pretrained(model_dir)
        model = GPT2LMHeadModel.from_pretrained(model_dir)
        
        # Move model to GPU if available
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        
        loaded_models[genre] = (model, tokenizer)
    
    return loaded_models[genre]

def generate_lyrics(genre, prompt, max_length=200, temperature=1.0, top_k=50, top_p=0.95):
    """Generate lyrics using the model for a specific genre"""
    model, tokenizer = load_model(genre)
    if model is None or tokenizer is None:
        return f"No trained model found for genre: {genre}"
    
    # Encode the prompt
    input_ids = tokenizer.encode(prompt, return_tensors="pt")
    
    # Move input to the same device as the model
    device = next(model.parameters()).device
    input_ids = input_ids.to(device)
    
    # Generate text
    output = model.generate(
        input_ids,
        max_length=max_length,
        temperature=temperature,
        top_k=top_k,
        top_p=top_p,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )
    
    # Decode the generated text
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
    
    return generated_text

@app.route('/api/generate', methods=['POST'])
def api_generate():
    """API endpoint to generate lyrics"""
    data = request.json
    
    # Get parameters from request
    genre = data.get('genre', 'pop')
    prompt = data.get('prompt', '')
    max_length = int(data.get('max_length', 200))
    temperature = float(data.get('temperature', 1.0))
    top_k = int(data.get('top_k', 50))
    top_p = float(data.get('top_p', 0.95))
    
    # Generate lyrics
    generated_text = generate_lyrics(
        genre=genre,
        prompt=prompt,
        max_length=max_length,
        temperature=temperature,
        top_k=top_k,
        top_p=top_p
    )
    
    # Get the writer name for this genre
    writer = GENRE_TO_WRITER.get(genre, "Unknown Writer")
    
    return jsonify({
        'genre': genre,
        'writer': writer,
        'prompt': prompt,
        'generated_text': generated_text
    })

@app.route('/api/writers', methods=['GET'])
def api_writers():
    """API endpoint to get all available writers and their genres"""
    writers = []
    for genre, writer in GENRE_TO_WRITER.items():
        model_dir = os.path.join("trained_models", genre)
        available = os.path.exists(model_dir)
        writers.append({
            'genre': genre,
            'name': writer,
            'available': available
        })
    
    return jsonify({'writers': writers})

@app.route('/api/collaborative', methods=['POST'])
def api_collaborative():
    """API endpoint for collaborative writing with multiple genre specialists"""
    data = request.json
    
    # Get parameters from request
    prompt = data.get('prompt', '')
    genres = data.get('genres', ['pop', 'hiphop', 'rnb'])
    max_length = int(data.get('max_length', 200))
    temperature = float(data.get('temperature', 1.0))
    
    # Generate lyrics from each genre specialist
    results = []
    for genre in genres:
        generated_text = generate_lyrics(
            genre=genre,
            prompt=prompt,
            max_length=max_length,
            temperature=temperature
        )
        
        writer = GENRE_TO_WRITER.get(genre, "Unknown Writer")
        results.append({
            'genre': genre,
            'writer': writer,
            'generated_text': generated_text
        })
    
    return jsonify({
        'prompt': prompt,
        'results': results
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
