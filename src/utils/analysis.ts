import type { HeadingItem, LengthCheck } from '../types';

export const analyzeTitle = (text: string): LengthCheck => {
    const length = text.length;
    let status: LengthCheck['status'] = 'good';
    let reason = 'Optimal length';

    if (length === 0) {
        status = 'error';
        reason = 'Missing';
    } else if (length < 30) {
        status = 'warning';
        reason = 'Too short (< 30)';
    } else if (length > 60) {
        status = 'warning';
        reason = 'Too long (> 60)';
    }

    return { text, length, status, reason };
};

export const analyzeDescription = (text: string): LengthCheck => {
    const length = text.length;
    let status: LengthCheck['status'] = 'good';
    let reason = 'Optimal length';

    if (length === 0) {
        status = 'error';
        reason = 'Missing';
    } else if (length < 50) {
        status = 'warning';
        reason = 'Too short (< 50)';
    } else if (length > 160) {
        status = 'warning';
        reason = 'Too long (> 160)';
    }

    return { text, length, status, reason };
};

export const validateHeadingHierarchy = (headings: HeadingItem[]): HeadingItem[] => {
    const result = [...headings];
    // Simple check: Don't skip levels going down (e.g. H1 -> H3).
    // H1 -> H2 is ok. H2 -> H2 is ok. H2 -> H3 is ok. H2 -> H1 is ok (new section).
    // H2 -> H4 is a skip.

    for (let i = 0; i < result.length; i++) {
        if (i === 0) continue;
        const current = result[i];
        const prev = result[i - 1];

        // Only care if we are going deeper
        if (current.level > prev.level) {
            if (current.level > prev.level + 1) {
                result[i].error = `Skipped heading level: H${prev.level} -> H${current.level}`;
            }
        }
    }
    return result;
};

const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
};

export const calculateReadability = (text: string): { score: number; grade: string; color: string } => {
    if (!text || text.trim().length === 0) {
        return { score: 0, grade: 'N/A', color: '#999' };
    }

    // Use a robust sentence splitter (handle filtered text)
    // Collapse multiple newlines/spaces into single space before splitting, OR treat newlines as potential sentence breaks if they look like list items
    // Better approach: Split by punctuation OR newlines that are likely independent thoughts
    const cleanText = text.replace(/(\r\n|\n|\r)/gm, ' . '); // Treat newlines as sentence breaks
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [text];
    const numSentences = Math.max(1, sentences.length);

    // Words
    const words = text.split(/\s+/).filter(w => w.length > 0 && /\w/.test(w));
    const numWords = words.length;

    if (numWords === 0) return { score: 0, grade: 'N/A', color: '#999' };

    const numSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

    // Flesch-Kincaid Grade Level
    const score = (0.39 * (numWords / numSentences)) + (11.8 * (numSyllables / numWords)) - 15.59;

    // Cap at 18 (Post-Graduate) to avoid "Grade 42" anomalies on bad parsing
    const roundedScore = Math.max(0, Math.min(18, Math.round(score * 10) / 10));

    let grade = '';
    let color = '';

    if (roundedScore <= 6) {
        grade = 'Easy (Elem)';
        color = 'var(--color-status-good)';
    } else if (roundedScore <= 10) {
        grade = 'Standard (HS)';
        color = '#f59e0b';
    } else if (roundedScore <= 14) {
        grade = 'Complex (College)';
        color = '#d9534f';
    } else {
        grade = 'Difficult (Grad+)';
        color = '#d9534f';
    }

    return { score: roundedScore, grade, color };
};
