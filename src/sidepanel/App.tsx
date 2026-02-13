import { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import SerpPreview from './components/SerpPreview';
import HeadingOutline from './components/HeadingOutline';
import LinkAuditor from './components/LinkAuditor';
import SocialTechCheck from './components/SocialTechCheck';
import CanonicalCheck from './components/CanonicalCheck';

import type { AnalysisResult, SemanticPayload } from '../types';
import { generateTopicalFocus } from '../utils/semantic';
import type { SemanticResult } from '../types'; // Updated import source
import { generateHTMLReport } from '../utils/reportGenerator';

function App() {
    const [data, setData] = useState<AnalysisResult | null>(null);
    const [semanticData, setSemanticData] = useState<SemanticResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [semanticLoading, setSemanticLoading] = useState<boolean>(false);
    console.debug('Semantic state:', semanticLoading); // Keep variable read to satisfy linter
    const [copyFeedback, setCopyFeedback] = useState<string>('');
    const [vectorFeedback, setVectorFeedback] = useState<string>('');

    const handleCopyReport = async () => {
        if (!data) return;

        try {
            const html = generateHTMLReport(data);
            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob(['SEOCrates Report copied. Paste into Google Docs to view.'], { type: 'text/plain' });

            const dataItem = [new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            })];

            await navigator.clipboard.write(dataItem);

            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(''), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setCopyFeedback('Error');
        }
    };

    const handleCopyVector = async () => {
        if (!semanticData?.vector) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(semanticData.vector));
            setVectorFeedback('Copied!');
            setTimeout(() => setVectorFeedback(''), 2000);
        } catch (err) {
            console.error('Failed to copy vector:', err);
            setVectorFeedback('Error');
        }
    }

    const lastAnalyzedUrl = useRef<string | null>(null);
    const analysisCache = useRef<Map<string, { data: AnalysisResult, semantic: SemanticResult }>>(new Map());

    useEffect(() => {
        const performAnalysis = async (force: boolean = false) => {
            // Query for active tab
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                const activeTab = tabs[0];
                if (activeTab?.id) {
                    const currentUrl = activeTab.url;

                    // Check if we can skip analysis (same URL active)
                    if (!force && currentUrl === lastAnalyzedUrl.current && data) {
                        return;
                    }

                    // Check Cache (switching back to previous tab)
                    if (!force && currentUrl && analysisCache.current.has(currentUrl)) {
                        const cached = analysisCache.current.get(currentUrl)!;
                        setData(cached.data);
                        setSemanticData(cached.semantic);
                        setLoading(false);
                        setSemanticLoading(false);
                        lastAnalyzedUrl.current = currentUrl;
                        return;
                    }

                    setLoading(true);
                    lastAnalyzedUrl.current = currentUrl || null;
                    // Reset semantic data immediately to avoid showing stale data from previous tab while loading
                    setSemanticData(null);

                    // Send message to content script
                    try {
                        const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'ANALYZE' }) as AnalysisResult | null;

                        setData(response);
                        setLoading(false);

                        // Trigger Semantic Analysis independently
                        setSemanticLoading(true);

                        // We know activeTab.id is defined here because we checked it above
                        const tabId = activeTab.id as number;

                        try {
                            // --- NEW: Request Weighted Payload instead of raw text ---
                            const payloadResponse = await chrome.tabs.sendMessage(tabId, { type: 'GET_WEIGHTED_TEXT' }) as SemanticPayload | null;
                            console.log('SEOCrates: GET_WEIGHTED_TEXT response received');

                            if (payloadResponse && payloadResponse.body && payloadResponse.body.length > 50) {
                                // Request idle callback or timeout to let UI render first
                                setTimeout(async () => {
                                    try {
                                        // Extract H1/H2 text for boosting (legacy support for boosting logic if needed, but payload has H1)
                                        // We still pass headers array for the term boosting logic in semantic.ts
                                        const headingText = response ? response.headings
                                            .filter(h => h.level <= 2)
                                            .map(h => h.text) : [];

                                        console.log('SEOCrates: Starting generation with weighted payload...');

                                        // Pass the structured payload directly
                                        const result = await generateTopicalFocus(payloadResponse, headingText);

                                        const fullSemantic = { ...result };
                                        setSemanticData(fullSemantic);
                                        setSemanticLoading(false);

                                        // Update Cache
                                        if (currentUrl && response) {
                                            analysisCache.current.set(currentUrl, {
                                                data: response,
                                                semantic: fullSemantic
                                            });
                                        }

                                    } catch (e) {
                                        console.error('Semantic Error:', e);
                                        setSemanticLoading(false);
                                    }
                                }, 100);
                            } else {
                                console.warn('SEOCrates: Insufficient or empty text received.');
                                setSemanticLoading(false);
                            }
                        } catch (textError) {
                            console.warn('SEOCrates: GET_WEIGHTED_TEXT failed (content script likely not ready):', textError);
                            setSemanticLoading(false);
                        }

                    } catch (err) {
                        console.warn('Could not connect to content script. Attempting injection...', err);

                        // --- ActiveTab Injection Fallback ---
                        // Only attempt injection if we haven't already tried it for this specific call (force=true implies retry)
                        if (activeTab.id && !force) {
                            try {
                                await chrome.scripting.executeScript({
                                    target: { tabId: activeTab.id },
                                    files: ['content.js']
                                });
                                // Retry analysis after injection with a slightly longer delay to ensure script init
                                setTimeout(() => performAnalysis(true), 500);
                            } catch (injectErr) {
                                console.error('Injection failed:', injectErr);
                                setData(null);
                                setLoading(false);
                            }
                        } else {
                            // If it fails even after injection, or no tab ID
                            console.error('Analysis failed after injection retry or no tab available.');
                            setData(null);
                            setLoading(false);
                        }
                    }
                } else {
                    setLoading(false);
                }
            });
        };

        // Initial run
        performAnalysis(false); // Changed to false to use cache on popup open if available

        // Listen for tab updates
        const handleTabUpdate = (_tabId: number, changeInfo: object, tab: chrome.tabs.Tab) => {
            if ('status' in changeInfo && changeInfo.status === 'complete' && tab.active) {
                // If the URL changed effectively, we force update and it will overwrite cache
                performAnalysis(true);
            }
        };

        // Listen for tab activation
        const handleTabActivated = () => {
            performAnalysis(false); // Try cache first
        };

        chrome.tabs.onUpdated.addListener(handleTabUpdate);
        chrome.tabs.onActivated.addListener(handleTabActivated);

        return () => {
            chrome.tabs.onUpdated.removeListener(handleTabUpdate);
            chrome.tabs.onActivated.removeListener(handleTabActivated);
        };
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-primary-navy)' }}>
                <div style={{ marginBottom: '10px' }}>Analyzing...</div>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <h3>Ready to Analyze</h3>
                <p style={{ marginTop: '10px', fontSize: '13px' }}>
                    Please reload the page or navigate to a new URL to trigger the analysis if it doesn't appear.
                    <br /><br />
                    <button
                        onClick={() => window.location.reload()}
                        style={{ background: 'var(--color-primary-navy)', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
                        Retry
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid var(--color-accent-gold)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/icon48.png" alt="SEOCrates Owl" style={{ width: '24px', height: '24px' }} />
                    <h1 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary-navy)' }}>SEOCrates</h1>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {semanticData?.vector && (
                        <button
                            onClick={handleCopyVector}
                            style={{
                                background: vectorFeedback === 'Copied!' ? 'var(--color-status-good)' : '#f0f0f0',
                                color: vectorFeedback === 'Copied!' ? 'white' : 'var(--color-primary-navy)',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            {vectorFeedback || 'Copy vector embedding'}
                        </button>
                    )}

                    <button
                        onClick={handleCopyReport}
                        style={{
                            background: copyFeedback === 'Copied!' ? 'var(--color-status-good)' : '#f0f0f0',
                            color: copyFeedback === 'Copied!' ? 'white' : 'var(--color-primary-navy)',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        {copyFeedback || '📋 Copy Report'}
                    </button>
                </div>
            </div>

            {/* Thesis Card Removed */}

            <Header data={data} />
            <SerpPreview
                title={data.title.text}
                description={data.description.text}
                url={data.canonical?.currentUrl || ''}
            />
            <HeadingOutline headings={data.headings} />
            <LinkAuditor links={data.links} />



            <CanonicalCheck canonical={data.canonical} />
            <SocialTechCheck social={data.social} />
        </div>
    );
}

export default App;
