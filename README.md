# Phishing Shield (Browser Extension + Local ML)

An advanced, real-time Phishing Detection system. It uses a **Local Random Forest AI Model** to analyze text and a **Browser Extension** that actively scans webpages for structural threats (like fake login forms and masked links).

---

## Easy Installation Guide

Because this project includes both a Machine Learning backend and a custom Browser Extension, installation is split into two easy steps.

### Step 1: Start the AI Backend
You need to run the Python server so the extension has a "brain" to talk to.
1. Make sure you have Python installed.
2. Open your terminal/command prompt and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python train_and_serve.py
   ```
*(Leave this terminal window open! The server will train itself instantly and wait for the browser to send it text).*

### Step 2: Install the Browser Extension
You don't need to download this from the Chrome Web Store. You can load it directly from your computer!
1. Open Google Chrome (or Microsoft Edge).
2. Type `chrome://extensions` in the URL bar and press Enter.
3. In the top right corner, turn on **Developer mode**.
4. Click the **Load unpacked** button in the top left.
5. Select the `extension` folder located inside this project folder.
6. The "Phishing Shield" icon will now appear in your browser toolbar!

---

## How to Use It

This extension offers two layers of protection:

### 1. Real-Time Active Defense (Automatic)
You don't have to do anything! As you browse the web or read emails (like in Gmail), the extension silently scans the page in the background. 
If you visit a dangerous page with a **Fake Login Form** or if the AI detects **Phishing Text**, a massive red warning banner will instantly drop down from the top of your screen to stop you.

### 2. Manual Deep Scan
If you feel suspicious about an email and want a detailed breakdown:
1. Click the **Phishing Shield icon** in your browser toolbar.
2. Click **Scan Current Page**.
3. It will extract the text, analyze the HTML structure, and show you exactly what is dangerous (e.g., highlighting specific suspicious keywords and extracting hidden URLs).

---
*Built for educational purposes and internship project demonstration.*
