import { pipeline, env } from '@xenova/transformers';
import type { SemanticResult, SemanticPayload } from '../types';

// Configure transformers.js to load from local models folder
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = chrome.runtime.getURL('models/');
env.useBrowserCache = false;

// Prevent WASM multi-threading crash
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('/');

// Singleton to hold the pipeline
let extractor: any = null;

export const loadModel = async () => {
    if (!extractor) {
        // 'feature-extraction' pipeline using the folder name we downloaded to
        extractor = await pipeline('feature-extraction', 'all-MiniLM-L6-v2', {
            quantized: true
        });
    }
    return extractor;
};

// Helpers Removed (No longer needed for Semantic Topics)

const cosineSimilarity = (a: Float32Array | number[], b: Float32Array | number[]): number => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// --- Helper Functions ---

// Updated generateTopicalFocus to accept structured payload
export const generateTopicalFocus = async (data: SemanticPayload | string, _headers: string[] = [], titleText: string = ''): Promise<SemanticResult> => { // Keep params compatible
    const pipe = await loadModel();

    // Handle legacy string input (fallback)
    let title = titleText;
    let metaDesc = '';
    let h1 = '';
    let bodyText = typeof data === 'string' ? data : data.body;

    if (typeof data !== 'string') {
        title = data.title;
        metaDesc = data.metaDescription;
        h1 = data.h1;
        bodyText = data.body;
    }

    // --- Task 1: Weighted Payload Construction ---
    const weightedText = `${title} ${title} ${h1} ${h1} ${metaDesc} ${bodyText}`;

    // Embed the Weighted Document (Main Vector)
    console.log('SEOCrates: Embedding weighted document...');
    const output = await pipe(weightedText, { pooling: 'mean', normalize: true });
    const weightedVector = output.data; // Float32Array

    // Note: Semantic Topics extraction loop has been removed as per user request.
    // We only return the vector and empty terms now.

    return {
        terms: [],
        vector: Array.from(weightedVector),
        alignmentScore: 0,
        ghostPhrases: []
    };
};

export const findCentroidSentence = async (text: string, pageVector: number[]): Promise<{ sentence: string; score: number } | null> => {
    if (!text || text.length < 50) return null;

    // --- Step 1: Segmentation ---
    // Note: content.ts flattens text, so we can't reliably split by newline here.
    // We rely on Intl.Segmenter to find boundaries.
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    const segments = Array.from(segmenter.segment(text));

    const pipeOrArrowRegex = /[|>]/; // Pipes/Arrows
    const blocklistRegex = /(search for|post a job|last updated|edited by|read time|author:|breadcrumb)/i;
    const standaloneYearRegex = /^\s*\d{4}\s*$/;

    const candidates = segments
        .map(s => s.segment.trim())
        .filter(s => {
            // Blocklist Check (moved here to prevent dropping full doc)
            if (blocklistRegex.test(s)) return false;
            if (standaloneYearRegex.test(s)) return false;

            // Word Count: 15-50 words
            const wordCount = s.split(/\s+/).length;
            if (wordCount < 15 || wordCount > 50) return false;

            // Structure: Must end in punctuation
            if (!/[.?!]$/.test(s)) return false;

            // No Pipes/Arrows
            if (pipeOrArrowRegex.test(s)) return false;

            return true;
        });

    // --- Step 3: Repetition Check (4-word phrases) ---
    const paramFilteredCandidates = candidates.filter(s => {
        const words = s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
        if (words.length < 8) return true;

        const phrases = new Set<string>();
        for (let i = 0; i <= words.length - 4; i++) {
            const phrase = words.slice(i, i + 4).join(' ');
            if (phrases.has(phrase)) return false;
            phrases.add(phrase);
        }
        return true;
    });

    // --- Step 4: Vector Scoring ---
    let bestSentence = '';
    let maxScore = -1;

    const pipe = await loadModel();

    console.log(`SEOCrates: ${paramFilteredCandidates.length} candidates after strict filtering.`);

    if (paramFilteredCandidates.length > 0) {
        for (const sentence of paramFilteredCandidates) {
            const output = await pipe(sentence, { pooling: 'mean', normalize: true });
            const sentenceVector = output.data;
            const score = cosineSimilarity(Array.from(pageVector), Array.from(sentenceVector));

            if (score > maxScore) {
                maxScore = score;
                bestSentence = sentence;
            }
        }
    }

    // --- Fallback Mechanism ---
    // If no candidate scores > 0.65, default to the first sentence of the first paragraph (The "Lede")
    if (maxScore <= 0.65) {
        console.log('SEOCrates: Max score low or no candidates. Attempting fallback...');

        let firstReasonableSentence = segments
            .map(s => s.segment.trim())
            .find(s => s.length > 30 && /[.?!]$/.test(s));

        // If strict punctuation fallback fails, just take the first substantial segment
        if (!firstReasonableSentence) {
            console.log('SEOCrates: Strict fallback failed. Trying loose fallback.');
            firstReasonableSentence = segments
                .map(s => s.segment.trim())
                .find(s => s.length > 40);
        }

        if (firstReasonableSentence) {
            console.log('SEOCrates: Fallback found:', firstReasonableSentence);
            const output = await pipe(firstReasonableSentence, { pooling: 'mean', normalize: true });
            const vector = output.data;
            const fallbackScore = cosineSimilarity(Array.from(pageVector), Array.from(vector));

            return { sentence: firstReasonableSentence, score: fallbackScore };
        } else {
            console.warn('SEOCrates: No fallback sentence found.');
        }
    } else {
        console.log(`SEOCrates: Found thesis with score ${maxScore}`);
    }

    if (!bestSentence) return null;

    return { sentence: bestSentence, score: maxScore };
};
