import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix
import random

app = Flask(__name__)
CORS(app) # Allow extension to access the API

print("=== Advanced Phishing Detection Model ===")
print("Generating massive synthetic dataset for Random Forest training...")

# 1. Advanced Synthetic Dataset (incorporating URL tricks)
safe_emails = [
    "Hi team, just a reminder about our meeting at 3 PM today. Please bring the Q3 report.",
    "Hey John, are we still on for lunch tomorrow? Let me know.",
    "Your Amazon package has been delivered. Tracking number is 123456789.",
    "Attached is the invoice for the software license renewal. Thank you.",
    "Let's review the new design drafts tomorrow morning.",
    "Don't forget to submit your timesheets by Friday at 5 PM.",
    "Welcome to the company! We are excited to have you on board.",
    "Can you please review my pull request? It fixes the login bug.",
    "The server maintenance is scheduled for Sunday at 2 AM.",
    "I will be out of office next week for vacation."
] * 100

phishing_emails = [
    "URGENT: Your account has been suspended! Click here http://bit.ly/suspend to verify your identity.",
    "You have won a $1000 Walmart gift card. Claim your prize immediately at http://192.168.1.15/claim.",
    "SECURITY ALERT: We detected a login attempt from Russia. If this wasn't you, reset your password now: http://reset-password.net/login.",
    "Dear customer, your bank account is locked. Please confirm your details by clicking the link.",
    "Invoice #99482 attached. Please pay immediately or legal action will be taken.",
    "Your PayPal account is limited. Log in to restore access: http://paypal-secure-update.com.",
    "CONGRATULATIONS! You have been selected for a free iPhone 14. Click here to claim.",
    "Update your Microsoft 365 credentials to prevent email deletion. Link: http://office365-update-now.com.",
    "Important tax document enclosed. Download the attached PDF to avoid penalties.",
    "Verify your crypto wallet immediately or lose all your funds. Click here to secure your Bitcoin http://10.0.0.5/wallet."
] * 100

# 2. Advanced Feature Injection
# We inject structural metadata directly into the text so the TF-IDF vectorizer picks it up as strong features!
def inject_heuristic_tokens(text, dom_flags=None):
    if dom_flags is None:
        dom_flags = {}
        
    injected_text = text
    
    # Check for IP-based URLs
    if re.search(r'http[s]?://[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', text):
        injected_text += " __HAS_IP_LINK__"
        
    # Check for URL Shorteners
    shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly']
    if any(shortener in text for shortener in shorteners):
        injected_text += " __HAS_SHORTENER__"
        
    # Inject DOM-level threats from the Browser Extension
    if dom_flags.get('has_masked_link'):
        injected_text += " __HAS_MASKED_LINK__"
    if dom_flags.get('has_fake_form'):
        injected_text += " __HAS_FAKE_FORM__"
        
    return injected_text

# Apply injection to training data (simulating some masked links and fake forms in the phishing set)
X_raw = safe_emails + phishing_emails
y = [0] * len(safe_emails) + [1] * len(phishing_emails)

X_processed = []
for i, text in enumerate(X_raw):
    # Simulate DOM threats for the phishing training data
    flags = {}
    if y[i] == 1 and random.random() > 0.5:
        flags['has_masked_link'] = True
    if y[i] == 1 and random.random() > 0.8:
        flags['has_fake_form'] = True
    X_processed.append(inject_heuristic_tokens(text, flags))

# Shuffle
combined = list(zip(X_processed, y))
random.shuffle(combined)
X_processed[:], y[:] = zip(*combined)

# 3. Train the Random Forest Model
print("Training the Random Forest AI model using Advanced Heuristics...")
X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)

# Random Forest is much better at capturing non-linear relationships (like the presence of multiple threat tokens)
model = make_pipeline(TfidfVectorizer(stop_words='english', token_pattern=r"(?u)\b\w+\b|__\w+__"), RandomForestClassifier(n_estimators=100, random_state=42))
model.fit(X_train, y_train)

# 4. Evaluate the Model
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
conf_matrix = confusion_matrix(y_test, predictions)

print("\n--- Advanced Model Evaluation ---")
print(f"Accuracy: {accuracy * 100:.2f}%")
print("Confusion Matrix:")
print(f"[{conf_matrix[0][0]} {conf_matrix[0][1]}]")
print(f"[{conf_matrix[1][0]} {conf_matrix[1][1]}]")
print("---------------------------------\n")

# 5. API Endpoint
def extract_ui_features(text):
    urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text)
    urgent_keywords = ['urgent', 'immediate', 'suspended', 'locked', 'verify', 'won', 'free', 'prize']
    found_keywords = [kw for kw in urgent_keywords if kw in text.lower()]
    return urls, found_keywords

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
        
    text = data['text']
    dom_flags = data.get('dom_flags', {})
    
    # Absolute Override: Fake forms are instantly critical
    if dom_flags.get('has_fake_form'):
        is_phishing = 1
        confidence = 100.0
    else:
        # Inject features and predict
        processed_text = inject_heuristic_tokens(text, dom_flags)
        is_phishing = model.predict([processed_text])[0]
        prob = model.predict_proba([processed_text])[0]
        confidence = float(max(prob) * 100)
    
    urls, keywords = extract_ui_features(text)
    
    return jsonify({
        'status': 'Phishing' if is_phishing == 1 else 'Safe',
        'confidence': f"{confidence:.2f}%",
        'urls_found': urls,
        'suspicious_keywords': keywords,
        'threats': dom_flags
    })

if __name__ == '__main__':
    print("Starting Advanced API Server on port 5000...")
    app.run(port=5000, debug=False)
