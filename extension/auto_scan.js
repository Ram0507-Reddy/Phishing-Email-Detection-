// auto_scan.js - Automatically runs on every page

let lastScannedText = "";
let scanTimeout = null;

function detectDOMThreats() {
    let hasMaskedLink = false;
    let hasFakeForm = false;

    // 1. Detect Masked Links (Visible text looks like a domain, but href is different)
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const text = link.innerText.trim().toLowerCase();
        const href = link.getAttribute('href');
        if (href && (text.includes('.com') || text.includes('.net') || text.includes('.org'))) {
            // Very basic heuristic: if visible text is a domain, but href doesn't contain that domain name
            const domainName = text.replace('www.', '').split('.')[0];
            if (!href.toLowerCase().includes(domainName)) {
                hasMaskedLink = true;
                console.warn(`Phishing Shield: Masked link detected! Text: ${text}, Href: ${href}`);
            }
        }
    });

    // 2. Detect Fake Login Forms (Password fields on insecure pages or weird targets)
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0) {
        // If there's a password field but the page is HTTP, that's highly suspicious
        if (window.location.protocol === 'http:') {
            hasFakeForm = true;
            console.warn("Phishing Shield: Password field found on insecure HTTP page.");
        }
        // Could also check form actions, but let's keep it simple and effective
    }

    return { has_masked_link: hasMaskedLink, has_fake_form: hasFakeForm };
}

function injectWarningBanner(confidence, domFlags) {
    if (document.getElementById('phishing-shield-warning')) return;

    let extraWarning = "";
    if (domFlags.has_fake_form) extraWarning += " (Fake Login Form Detected!)";
    if (domFlags.has_masked_link) extraWarning += " (Masked Links Detected!)";

    const banner = document.createElement('div');
    banner.id = 'phishing-shield-warning';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #ef4444;
        color: white;
        text-align: center;
        padding: 15px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 16px;
        font-weight: bold;
        z-index: 2147483647;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
    `;
    
    banner.innerHTML = `
        <span>🚨 <strong>CRITICAL THREAT:</strong> This page has been flagged as a Phishing attack! Conf: ${confidence} ${extraWarning}</span>
        <button id="phishing-shield-dismiss" style="background: white; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Dismiss</button>
    `;
    
    document.body.prepend(banner);

    document.getElementById('phishing-shield-dismiss').addEventListener('click', () => {
        banner.remove();
    });
}

async function performScan() {
    const pageText = document.body.innerText;
    
    if (!pageText || pageText.length < 50 || pageText === lastScannedText) {
        return;
    }
    
    lastScannedText = pageText;
    const domFlags = detectDOMThreats();

    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: pageText, dom_flags: domFlags })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'Phishing') {
                injectWarningBanner(data.confidence, data.threats);
            }
        }
    } catch (err) {
        // Silent fail
    }
}

setTimeout(performScan, 2000);

const observer = new MutationObserver((mutations) => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(performScan, 1500);
});

observer.observe(document.body, { childList: true, subtree: true });
