import type { AnalysisResult, LinkItem } from '../types';
import { analyzeTitle, analyzeDescription, validateHeadingHierarchy, calculateReadability } from '../utils/analysis';

// --- State Management for Observer ---
let isStable = false;
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let killSwitchTimer: ReturnType<typeof setTimeout> | null = null;
let currentWordCount = 0;
let pendingResponses: Array<(response: AnalysisResult | null) => void> = [];

// --- Idempotency Guard ---
if ((window as any).SEOCratesInitialized) {
    // If already initialized, just ensure listener is active (it should be)
    // and exit to prevent double-observer or duplicate listeners.
    throw new Error('SEOCrates already initialized');
}
(window as any).SEOCratesInitialized = true;

// Configuration
const OBSERVER_TIMEOUT_MS = 5000; // 5 seconds max
const DEBOUNCE_DELAY_MS = 800;    // Wait for 800ms of silence
const STABILITY_THRESHOLD = 200;  // If word count > 200, we might be good
const LOW_WORD_COUNT_THRESHOLD = 50;

/**
 * Deep Read: Extracts text content from specific containers while filtering out noise.
 * This is more robust for SPAs and hidden content (e.g. accordions) than innerText.
 */
const getDeepReadContent = (): string => {
    // 1. Target specific containers if available, otherwise fallback to body
    const containers = document.querySelectorAll('main, article, #content, .content, .post-body, body');
    let targetContainer: Element = document.body;

    // Pick the most specific container that isn't empty
    for (let i = 0; i < containers.length; i++) {
        if (containers[i].tagName.toLowerCase() !== 'body' || containers.length === 1) {
            // Simple heuristic: check if it has decent length
            if ((containers[i].textContent || '').length > 100) {
                targetContainer = containers[i];
                break;
            }
        }
    }

    // 2. Clone to avoid mutation
    const clone = targetContainer.cloneNode(true) as HTMLElement;

    // 3. Filter Noise Tags
    // Requirement specifies: <script>, <style>, <nav>
    // We add others common for "main content" filtering
    const noiseSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 'noscript', 'iframe', 'svg',
        '.ad', '.ads', '.sidebar', 'aside', '.menu', '.modal', '.popup', '#sidebar', '#comments'
    ];

    noiseSelectors.forEach(sel => {
        const elements = clone.querySelectorAll(sel);
        elements.forEach(el => el.remove());
    });

    // 4. Use textContent to grab even hidden text (e.g. collapsed accordions)
    let text = clone.textContent || '';

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};


const scrapePageInternal = (): AnalysisResult => {
    // Title
    const titleText = document.title || '';
    const titleAnalysis = analyzeTitle(titleText);

    // Meta Description
    const metaDescElement = document.querySelector('meta[name="description"]');
    const metaDescText = metaDescElement ? metaDescElement.getAttribute('content') || '' : '';
    const descAnalysis = analyzeDescription(metaDescText);

    // Robots
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsContent = robotsMeta ? robotsMeta.getAttribute('content') || '' : '';
    const isIndexable = !robotsContent.toLowerCase().includes('noindex');

    // Headings (Existing logic)
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    // Unified Heading Extraction (Global Scan)
    // We want ALL visible headings, even in nav/footer, to ensure complete structure audit.
    const visibleHeadings = headingElements.filter(el => {
        const element = el as HTMLElement;

        // Rule 1: Visibility check
        if (element.offsetParent === null) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none') return false;
        if (style.visibility === 'hidden') return false;

        return true;
    });

    const rawHeadings = visibleHeadings.map((el, index) => {
        // Simple content extraction for headings context
        let sectionText = '';
        let nextNode = el.nextSibling;
        const nextHeader = visibleHeadings[index + 1];

        while (nextNode && nextNode !== nextHeader) {
            if (nextNode.nodeType === Node.TEXT_NODE) {
                sectionText += nextNode.textContent || '';
            } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                const element = nextNode as HTMLElement;
                const tagName = element.tagName.toLowerCase();
                if (!['script', 'style', 'noscript', 'nav', 'footer', 'iframe'].includes(tagName)) {
                    sectionText += element.innerText || '';
                }
            }
            nextNode = nextNode.nextSibling;
        }

        return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.trim() || '',
            level: parseInt(el.tagName.substring(1)),
            content: sectionText.replace(/\s+/g, ' ').trim().slice(0, 1000)
        };
    });
    const headings = validateHeadingHierarchy(rawHeadings);

    // Links
    const allLinks = Array.from(document.querySelectorAll('a'));
    const mainContentLinks = allLinks.filter(a => {
        if (a.closest('header') || a.closest('footer') || a.closest('nav')) return false;
        return true;
    });

    const internalLinks: LinkItem[] = [];
    const externalLinks: LinkItem[] = [];

    mainContentLinks.forEach(a => {
        const href = a.href;
        const text = a.textContent?.trim() || '[No Text]';
        if (!href) return;
        try {
            const url = new URL(href, window.location.href);
            if (url.hostname === window.location.hostname) {
                internalLinks.push({ anchor: text, href });
            } else {
                externalLinks.push({ anchor: text, href });
            }
        } catch (e) { /* ignore */ }
    });

    // Social & Tech (Existing)
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const hasOg = !!(ogTitle || ogDesc || ogImage);

    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
    const twitterSite = document.querySelector('meta[name="twitter:site"]')?.getAttribute('content');
    const hasTwitter = !!(twitterCard || twitterSite);

    const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const schemaData: any[] = [];
    schemaScripts.forEach(script => {
        try {
            const json = JSON.parse(script.textContent || '{}');
            if (Array.isArray(json)) {
                schemaData.push(...json);
            } else if (json['@graph'] && Array.isArray(json['@graph'])) {
                schemaData.push(...json['@graph']);
            } else {
                schemaData.push(json);
            }
        } catch (e) { /* ignore */ }
    });

    // Canonical
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonicalLink ? canonicalLink.getAttribute('href') || '' : '';
    const currentUrlRaw = window.location.href.split('#')[0];
    let isCanonicalMatch = false;
    if (canonicalHref) {
        try {
            const canonicalUrl = new URL(canonicalHref, window.location.href).href;
            isCanonicalMatch = canonicalUrl === currentUrlRaw;
        } catch (e) { isCanonicalMatch = false; }
    }

    // --- NEW: Deep Read Word Count ---
    const mainContentText = getDeepReadContent();
    const wordCount = mainContentText.split(/\s+/).filter(w => w.length > 0).length;
    const readability = calculateReadability(mainContentText);

    // Update global current word count for observer checks
    currentWordCount = wordCount;

    return {
        title: titleAnalysis,
        description: descAnalysis,
        robots: { content: robotsContent, isIndexable },
        headings,
        links: {
            internal: internalLinks,
            external: externalLinks,
            counts: {
                internal: internalLinks.length,
                external: externalLinks.length,
                total: internalLinks.length + externalLinks.length
            }
        },
        social: {
            openGraph: { exists: hasOg, title: ogTitle || undefined, description: ogDesc || undefined, image: ogImage || undefined },
            twitterCard: { exists: hasTwitter, card: twitterCard || undefined, site: twitterSite || undefined },
            schemaOrg: { exists: schemaScripts.length > 0, data: schemaData }
        },
        canonical: { href: canonicalHref, isMatch: isCanonicalMatch, currentUrl: currentUrlRaw },
        wordCount,
        readability
    };
};

// --- Time-Boxed Observer Logic ---

const checkStability = () => {
    // Perform a lightweight check or full scrape?
    // Let's do a full scrape to get the word count.
    const result = scrapePageInternal();

    // Stability Check Logic:
    // If we jumped from a low count to a high count, we can probably stop early.
    // However, because we are "Time-Boxed", we can also just wait for the debounce.
    // The requirement says: "If word count jumps from <50 to >200... trigger immediately"

    // Since we just calculated it, let's see.
    // Note: currentWordCount is updated in scrapePageInternal()

    // If we are here, it means debounce fired (content has been stable for 500ms).
    // So we invoke the completion.
    completeAnalysis(result);
};

const completeAnalysis = (result: AnalysisResult) => {
    isStable = true;
    disconnectObserver();

    // Send response to all pending requests
    pendingResponses.forEach(callback => callback(result));
    pendingResponses = [];
};

const disconnectObserver = () => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (killSwitchTimer) {
        clearTimeout(killSwitchTimer);
        killSwitchTimer = null;
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
};

const onMutation = () => {
    if (isStable) return;

    // Reset debounce
    if (debounceTimer) clearTimeout(debounceTimer);

    // Stability Check (Immediate Trigger)
    // We strictly need to calculate word count to know if we jumped.
    // This might be expensive on every mutation. 
    // Optimization: Only check if we are currently "low".
    if (currentWordCount < LOW_WORD_COUNT_THRESHOLD) {
        // Quick check without full heavy lifting if possible, or just run the deep read.
        // Deep read is relatively fast.
        const text = getDeepReadContent();
        const count = text.split(/\s+/).filter(w => w.length > 0).length;

        if (count > STABILITY_THRESHOLD) {
            console.log('SEOCrates: Word count jump detected, stabilizing immediately.');
            currentWordCount = count;
            checkStability(); // logic inside essentially completes it
            return;
        }
        currentWordCount = count;
    }

    // Set debounce for "silence" check
    debounceTimer = setTimeout(() => {
        console.log('SEOCrates: DOM stable for 500ms.');
        checkStability();
    }, DEBOUNCE_DELAY_MS);
};

const initObserver = () => {
    if (isStable) return;

    // Initial check
    const initialText = getDeepReadContent();
    currentWordCount = initialText.split(/\s+/).filter(w => w.length > 0).length;

    // Setup Observer
    observer = new MutationObserver(onMutation);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Kill Switch
    killSwitchTimer = setTimeout(() => {
        if (!isStable) {
            console.log('SEOCrates: Observer timeout (5s). Forcing completion.');
            checkStability();
        }
    }, OBSERVER_TIMEOUT_MS);

    // Initial Silence Check: If the page is already static, we won't get mutations.
    // Trigger the same debounce logic to finish if nothing happens.
    if (!debounceTimer) {
        debounceTimer = setTimeout(() => {
            console.log('SEOCrates: Initial stability check (static page).');
            checkStability();
        }, DEBOUNCE_DELAY_MS);
    }
};

// Global Message Listener - Registered Immediately
// --- NEW: Weighted Content Extraction ---
const getWeightedContent = () => {
    // 1. Primary Signals
    const title = document.title || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1 = document.querySelector('h1')?.innerText || '';

    // 2. Body Text Cleaning
    // Target candidate containers
    const candidates = document.querySelectorAll('article, main, .post-body, .content, #content, body');
    let targetContainer: Element = document.body;

    // Selection Heuristic: Dense Text Block
    // Prefer article/main if they have substantial content
    for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i] as HTMLElement;
        // Skip body in this loop unless it's the only option, handled by default init
        if (el.tagName.toLowerCase() === 'body') continue;

        // Check density: High P tag count or substantial text length
        const pCount = el.querySelectorAll('p').length;
        const textLen = el.innerText.length;

        if (pCount > 3 && textLen > 500) {
            targetContainer = el;
            break; // Found a good candidate
        }
    }

    // Clone to manipulate safely
    const clone = targetContainer.cloneNode(true) as HTMLElement;

    // Aggressive Cleaning
    const noiseSelectors = [
        'nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript', 'iframe', 'svg',
        '.ad', '.ads', '.sidebar', '.menu', '.modal', '.popup', '.cookie-banner',
        '[hidden]', '[aria-hidden="true"]'
    ];
    noiseSelectors.forEach(sel => {
        const elements = clone.querySelectorAll(sel);
        elements.forEach(el => el.remove());
    });

    // Extract Text
    let bodyText = clone.innerText || '';
    bodyText = bodyText.replace(/\s+/g, ' ').trim();

    // Truncate to ~2000 chars for embedding relevance (Model specific optimization)
    // We want the "meat" of the content, not the footer drift.
    const cleanBody = bodyText.slice(0, 2500); // slightly over fetch to allow for clean cut

    return {
        title,
        metaDescription: metaDesc,
        h1,
        body: cleanBody
    };
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // console.log('SEOCrates: Message received', request.type); // Reduced logging
    if (request.type === 'ANALYZE') {
        try {
            if (isStable) {
                const result = scrapePageInternal();
                sendResponse(result);
            } else {
                pendingResponses.push(sendResponse);
                return true;
            }
        } catch (e) {
            console.error('SEOCrates Scraping Error:', e);
            sendResponse(null);
        }
    } else if (request.type === 'GET_TEXT') {
        // Legacy support if needed, but we should migrate to GET_WEIGHTED_TEXT
        try {
            const text = getDeepReadContent();
            sendResponse({ text: text.slice(0, 15000) });
        } catch (e) {
            sendResponse({ text: '' });
        }
    } else if (request.type === 'GET_WEIGHTED_TEXT') {
        try {
            const payload = getWeightedContent();
            sendResponse(payload);
        } catch (e) {
            console.error('SEOCrates Weighted Extraction Error:', e);
            sendResponse(null);
        }
    }
    return undefined;
});

// ... (Rest of functions: performAnalysis, scrapePageInternal, etc.) ...

// Start Observer safely
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObserver);
    } else {
        initObserver();
    }
    console.log('SEOCrates: Observer initialized');
} catch (e) {
    console.error('SEOCrates: Initialization Error', e);
}
