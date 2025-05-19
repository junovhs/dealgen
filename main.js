// Enhanced animation for confetti when clicking checkboxes
// Ensure confetti is globally available if loaded via CDN
const confetti = window.confetti || null;

function triggerSpecialConfetti() {
    if (!confetti) {
        console.warn("Confetti library not loaded.");
        return;
    }
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        confetti({
        particleCount: 2,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        startVelocity: randomInRange(30, 60),
        ticks: randomInRange(100, 200),
        colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f97316'],
        zIndex: 1000
        });
    }, 200);

    setTimeout(() => clearInterval(interval), 1500);
}

// Add date detection function for identifying expiry dates in deal text
// This function is now globally available for app.js to use
function findExpiryDate(text) {
    // More robust regex to capture various date formats and contexts
    // Looks for keywords like expires, valid until, book by, through, etc. followed by a date.
    // Also captures standalone dates M(M)/D(D)/YY(YY) or Month DD, YYYY etc.
    // Use g flag to find ALL matches
    const dateRegex = /(?:expires?|valid until|book by|travel by|through|ends|until|before|offer valid|sale ends)\s*:?\s*((?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:(?:,\s*|\s+)\d{2,4})?)|(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:(?:,\s*|\s+)\d{2,4})?))|\b((?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:(?:,\s*|\s+)\d{2,4})?)|(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:(?:,\s*|\s+)\d{2,4})?))\b/gi; // Added 'g' flag

    const matches = [...text.matchAll(dateRegex)]; // Find all matches

    if (matches.length === 0) return null;

    // Get the last match as the likely expiry date
    const lastMatch = matches[matches.length - 1];

    // Extract the date part (either group 1 or group 2 based on regex structure)
    let dateString = lastMatch[1] || lastMatch[2];

    // Basic cleanup: remove potential leading/trailing non-date chars if keyword wasn't perfectly matched
    dateString = dateString.replace(/^[,\s]+|[,\s]+$/g, '').trim();

    // Attempt to create a Date object to validate and format
    let possibleDate = new Date(dateString);
    let formattedDate = null;
    if (!isNaN(possibleDate.getTime())) {
        // Format as M/D
        formattedDate = `${possibleDate.getMonth() + 1}/${possibleDate.getDate()}`;
    } else {
        // Handle cases where Date() constructor fails (e.g., "Dec 31")
        // Try a simpler regex for M/D or Month DD extraction if possible, otherwise fallback
        const simpleDateMatch = dateString.match(/(\d{1,2})[\/\.-](\d{1,2})|(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\s+(\d{1,2})/i);
        if(simpleDateMatch) {
             if(simpleDateMatch[1] && simpleDateMatch[2]) { // M/D format
                 formattedDate = `${parseInt(simpleDateMatch[1])}/${parseInt(simpleDateMatch[2])}`;
             } else if (simpleDateMatch[3] && simpleDateMatch[4]) { // Month DD format
                 const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
                 formattedDate = `${monthMap[simpleDateMatch[3].toLowerCase()]}/${parseInt(simpleDateMatch[4])}`;
             }
        }
        // If still no formatted date, maybe log a warning or return the raw string
        if (!formattedDate) {
            console.warn("Could not parse or format date string reliably:", dateString);
            // Fallback or return null depending on desired behavior
            // For now, let's return the cleaned string if formatting fails
            formattedDate = dateString; // Or return null if strict formatting is required
        }
    }

    return {
        fullMatch: lastMatch[0], // The full text matched including keyword if present
        cleanedDate: dateString, // Just the extracted date string
        formattedShortDate: formattedDate // M/D formatted date, or null/original if failed
    };
}

// The function can be called from React using window.triggerSpecialConfetti
window.triggerSpecialConfetti = triggerSpecialConfetti;

// Note: findExpiryDate is now defined globally in this script's scope
// and will be available to app.js when it runs.
window.findExpiryDate = findExpiryDate;