import torch
from transformers import pipeline

# Load a pre-trained zero-shot classification model
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device="cpu")

def classify_text():
    while True:
        text = input("Enter your text (type 'exit' to quit):")
        if text == "exit":
            break
        categories = ["education", "sports"]
        result = classifier(text, candidate_labels=categories)
        predicted_category = result["labels"][0]
        print(result)
        print(predicted_category)

classify_text()