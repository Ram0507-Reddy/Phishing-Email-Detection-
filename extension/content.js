// content.js
// Extracts text and DOM threats from the current webpage for manual scanning
(() => {
    let hasMaskedLink = false;
    let hasFakeForm = false;

    // Detect Masked Links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const text = link.innerText.trim().toLowerCase();
        const href = link.getAttribute('href');
        if (href && (text.includes('.com') || text.includes('.net') || text.includes('.org'))) {
            const domainName = text.replace('www.', '').split('.')[0];
            if (!href.toLowerCase().includes(domainName)) {
                hasMaskedLink = true;
            }
        }
    });

    // Detect Fake Forms
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length > 0 && window.location.protocol === 'http:') {
        hasFakeForm = true;
    }

    return {
        text: document.body.innerText,
        dom_flags: { has_masked_link: hasMaskedLink, has_fake_form: hasFakeForm }
    };
})();
