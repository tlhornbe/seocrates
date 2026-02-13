import React from 'react';

interface SerpPreviewProps {
    title: string;
    description: string;
    url: string;
}

const SerpPreview: React.FC<SerpPreviewProps> = ({ title, description, url = '' }) => {
    React.useEffect(() => {
        console.log('SEOCrates: SerpPreview mounted', { title, description, url });
    }, [title, description, url]);

    // Helper to format the URL for display (breadcrumb style)
    const formatUrl = (urlStr: string) => {
        if (!urlStr) return { domain: 'example.com', fullPath: '', breadcrumbs: '' };

        try {
            const urlObj = new URL(urlStr);
            const domain = urlObj.hostname.replace('www.', '');
            const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
            // Breadcrumb convention: Domain > Path parts
            const parts = path.split('/').filter(p => p);

            return {
                domain,
                fullPath: urlStr,
                breadcrumbs: parts.length > 0 ? ` › ${parts.join(' › ')}` : ''
            };
        } catch (e) {
            return { domain: urlStr, fullPath: urlStr, breadcrumbs: '' };
        }
    };

    const urlData = formatUrl(url);
    const displayTitle = title || 'No Title';
    const displayDesc = description || 'No meta description available. Google will likely generate a snippet from the page content instead.';

    return (
        <div className="card" style={{ padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: '12px' }}>
                <span>Google Search Preview</span>
            </div>

            {/* Simulation Container */}
            <div style={{
                fontFamily: 'arial, sans-serif',
                maxWidth: '600px' // Google's desktop width approx
            }}>
                {/* Header: Icon + Site Name + URL */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f3f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        flexShrink: 0
                    }}>
                        <img
                            src={(() => {
                                const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
                                faviconUrl.searchParams.set('pageUrl', urlData.fullPath || 'https://example.com');
                                faviconUrl.searchParams.set('size', '32');
                                return faviconUrl.toString();
                            })()}
                            alt=""
                            style={{ width: '16px', height: '16px' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3' }}>
                        <span style={{ fontSize: '14px', color: '#202124', fontWeight: '400' }}>
                            {urlData.domain}
                        </span>
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>
                            {urlData.fullPath}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '4px', maxWidth: '600px' }}>
                    <a href="#" onClick={(e) => e.preventDefault()} style={{
                        fontSize: '20px',
                        color: '#1a0dab',
                        textDecoration: 'none',
                        lineHeight: '1.3',
                        cursor: 'default',
                        display: '-webkit-box',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                    }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                    >
                        {displayTitle}
                    </a>
                </div>

                {/* Description */}
                <div style={{
                    fontSize: '14px',
                    color: '#4d5156',
                    lineHeight: '1.58',
                    wordWrap: 'break-word',
                    maxWidth: '600px',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {/* Date could be here if relevant, but omitted for generic pages */}
                    {displayDesc}
                </div>
            </div>
        </div>
    );
};

export default SerpPreview;
