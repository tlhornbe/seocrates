export interface LengthCheck {
    text: string;
    length: number;
    status: 'good' | 'warning' | 'error';
    reason?: string;
}

export interface RobotsStatus {
    content: string;
    isIndexable: boolean;
}

// ... (keep middle sections unchanged implicitly by targeting around them if possible, but I'll safer to just replace from top to bottom of affected area or do two edits. I'll replace top section first.)

export interface HeadingItem {
    tag: string;
    text: string;
    level: number;
    error?: string; // e.g., "Skipped level"
    content?: string; // Text content of the section
}

export interface LinkItem {
    anchor: string;
    href: string;
}

export interface LinkAnalysis {
    internal: LinkItem[];
    external: LinkItem[];
    counts: {
        internal: number;
        external: number;
        total: number;
    };
}

export interface SocialTags {
    openGraph: {
        exists: boolean;
        title?: string;
        description?: string;
        image?: string;
    };
    twitterCard: {
        exists: boolean;
        card?: string;
        site?: string;
    };
    schemaOrg: {
        exists: boolean;
        data: any[]; // Full JSON-LD objects
    };
}

export interface CanonicalStatus {
    href: string;
    isMatch: boolean;
    currentUrl: string; // Added for comparison display
}

export interface AnalysisResult {
    title: LengthCheck;
    description: LengthCheck;
    robots: RobotsStatus;
    headings: HeadingItem[];
    links: LinkAnalysis;
    social: SocialTags;
    canonical: CanonicalStatus;
    wordCount: number;
    readability: {
        score: number;
        grade: string;
        color?: string;
    };
}

export interface SemanticPayload {
    title: string;
    metaDescription: string;
    h1: string;
    body: string;
}

export interface SemanticResult {
    terms: string[];
    vector: number[];
    alignmentScore?: number;
    healthCategory?: 'Strong' | 'Partial Drift' | 'Critical Gap';
    ghostPhrases?: string[];
    centroid?: { sentence: string; score: number };
}
