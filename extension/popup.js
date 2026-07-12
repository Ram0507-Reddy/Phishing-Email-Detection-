document.getElementById('scanBtn').addEventListener('click', async () => {
    const btn = document.getElementById('scanBtn');
    const loader = document.getElementById('loader');
    const resultBox = document.getElementById('result-box');
    
    btn.disabled = true;
    loader.style.display = 'block';
    resultBox.style.display = 'none';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const extractedData = injectionResults[0].result;
        const pageText = extractedData.text;
        const domFlags = extractedData.dom_flags;

        if (!pageText || pageText.trim().length === 0) {
            throw new Error("No text found on the page.");
        }

        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: pageText, dom_flags: domFlags })
        });

        if (!response.ok) {
            throw new Error("Failed to reach the local ML backend. Is it running?");
        }

        const data = await response.json();
        
        const statusEl = document.getElementById('status');
        const confEl = document.getElementById('confidence');
        
        if (data.status === 'Phishing') {
            statusEl.textContent = '🚨 PHISHING DETECTED';
            statusEl.className = 'status phishing';
        } else {
            statusEl.textContent = '✅ SAFE';
            statusEl.className = 'status safe';
        }
        
        confEl.textContent = `Model Confidence: ${data.confidence}`;
        
        // Show DOM structural threats if any
        let threatText = "";
        if (data.threats.has_fake_form) threatText += "<div>⚠️ INSECURE LOGIN FORM DETECTED!</div>";
        if (data.threats.has_masked_link) threatText += "<div>⚠️ MASKED LINKS DETECTED!</div>";
        if (!threatText) threatText = "None detected";
        
        document.getElementById('structural-threats').innerHTML = threatText;
        
        document.getElementById('keywords').textContent = 
            data.suspicious_keywords && data.suspicious_keywords.length > 0 
            ? data.suspicious_keywords.join(', ') 
            : 'None detected';
            
        document.getElementById('urls').innerHTML = 
            data.urls_found && data.urls_found.length > 0 
            ? data.urls_found.join('<br>') 
            : 'None detected';

        loader.style.display = 'none';
        resultBox.style.display = 'block';
    } catch (error) {
        alert("Error: " + error.message);
        loader.style.display = 'none';
    } finally {
        btn.disabled = false;
    }
});
