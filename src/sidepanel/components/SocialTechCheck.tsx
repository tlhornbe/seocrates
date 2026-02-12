import React, { useState } from 'react';
import type { SocialTags } from '../../types';

interface SocialTechCheckProps {
    social: SocialTags;
}

const AccordionItem: React.FC<{ label: string; passed: boolean; children?: React.ReactNode; isOpen?: boolean }> = ({ label, passed, children, isOpen = false }) => (
    <details open={isOpen} style={{ marginBottom: '8px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
        <summary style={{
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafafa',
            fontSize: '14px',
            listStyle: 'none'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                {passed ? (
                    <span style={{ color: 'var(--color-status-good)', fontWeight: 'bold', fontSize: '13px' }}>✓ Found</span>
                ) : (
                    <span style={{ color: '#999', fontSize: '13px' }}>✕ Missing</span>
                )}
            </div>
        </summary>
        {children && passed && (
            <div style={{ padding: '0', borderTop: '1px solid #eee', fontSize: '12px', color: '#444' }}>
                {children}
            </div>
        )}
    </details>
);

// Improved JSON Viewer for Schema details
const SchemaViewer: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
    const [expanded, setExpanded] = useState<boolean>(true);

    if (data === null) return <span style={{ color: '#999' }}>null</span>;
    if (data === undefined) return <span style={{ color: '#999' }}>undefined</span>;

    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object';

    // Primitives
    if (!isObject) {
        let color = '#333';
        let displayValue = String(data);

        if (typeof data === 'string') {
            color = '#22863a'; // Green for strings
            displayValue = `"${data}"`;
        }
        if (typeof data === 'number') color = '#005cc5'; // Blue for numbers
        if (typeof data === 'boolean') color = '#d73a49'; // Red for booleans

        return <span style={{ color, wordBreak: 'break-word', fontFamily: 'Consolas, monospace' }}>{displayValue}</span>;
    }

    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ fontFamily: 'Consolas, monospace' }}>{isArray ? '[]' : '{}'}</span>;

    return (
        <div style={{ marginLeft: level > 0 ? '20px' : '0', fontFamily: 'Consolas, monospace' }}>
            {level > 0 && (
                <div
                    style={{ cursor: 'pointer', userSelect: 'none', color: '#666', fontSize: '11px', display: 'inline-block', marginBottom: '2px' }}
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {expanded ? '▼' : '▶'}
                </div>
            )}

            {(!expanded && level > 0) ? (
                <span style={{ color: '#666', fontStyle: 'italic', cursor: 'pointer' }} onClick={() => setExpanded(true)}>
                    {isArray ? `Array(${data.length})` : '{...}'}
                </span>
            ) : (
                <div style={{ paddingLeft: level > 0 ? '4px' : '0' }}>
                    {keys.map((key) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.5' }}>
                            <span style={{ color: '#d73a49', marginRight: '4px', whiteSpace: 'nowrap' }}>
                                {isArray ? '' : `"${key}":`}
                            </span>
                            <SchemaViewer data={data[key]} level={level + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SchemaItem: React.FC<{ data: any }> = ({ data }) => {
    // Extract @type safely
    let typeLabel = 'Unknown Type';
    if (data && data['@type']) {
        typeLabel = Array.isArray(data['@type']) ? data['@type'].join(', ') : data['@type'];
    } else if (data && data['@context']) {
        typeLabel = 'Root Context';
    }

    // Determine icon based on type (simple heuristic)
    let icon = '📄';
    if (typeLabel.includes('Breadcrumb')) icon = '🍞';
    if (typeLabel.includes('Article') || typeLabel.includes('Blog')) icon = '📰';
    if (typeLabel.includes('Organization') || typeLabel.includes('LocalBusiness')) icon = '🏢';
    if (typeLabel.includes('Product')) icon = '🛍️';
    if (typeLabel.includes('FAQ')) icon = '❓';
    if (typeLabel.includes('Video')) icon = '🎥';
    if (typeLabel.includes('Image')) icon = '🖼️';

    return (
        <details style={{ marginBottom: '8px', border: '1px solid #e1e4e8', borderRadius: '6px', backgroundColor: 'white' }}>
            <summary style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '13px',
                fontWeight: 600,
                color: '#24292e',
                listStyle: 'none', // Hide default arrow
                outline: 'none'
            }}>
                <span style={{ marginRight: '8px', fontSize: '16px' }}>{icon}</span>
                <span style={{ flex: 1 }}>{typeLabel}</span>
                <span style={{ color: '#586069', fontSize: '10px', marginLeft: '8px' }}>expand</span>
            </summary>

            <div style={{
                padding: '12px',
                backgroundColor: '#f6f8fa',
                borderTop: '1px solid #e1e4e8',
                overflowX: 'auto',
                fontSize: '12px'
            }}>
                <SchemaViewer data={data} />
            </div>
        </details>
    );
};


const SocialTechCheck: React.FC<SocialTechCheckProps> = ({ social }) => {
    // Flatten schema data if it's nested in @graph or simple array
    const getSchemaList = () => {
        if (!social.schemaOrg.data) return [];
        if (Array.isArray(social.schemaOrg.data)) return social.schemaOrg.data;
        return [social.schemaOrg.data];
    };

    const schemaList = getSchemaList();

    return (
        <div className="card">
            <div className="card-header">
                <span>Structured Data</span>
            </div>

            <div>
                {/* General Social Checks */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#586069', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Social Meta
                    </div>

                    <AccordionItem label="Open Graph" passed={social.openGraph.exists}>
                        <div style={{ padding: '8px 12px' }}>
                            {social.openGraph.title && <div style={{ marginBottom: '4px' }}><strong>Title:</strong> {social.openGraph.title}</div>}
                            {social.openGraph.description && <div style={{ marginBottom: '4px' }}><strong>Desc:</strong> {social.openGraph.description}</div>}
                            {social.openGraph.image && <div><strong>Image:</strong> Found</div>}
                        </div>
                    </AccordionItem>

                    <AccordionItem label="Twitter Card" passed={social.twitterCard.exists}>
                        <div style={{ padding: '8px 12px' }}>
                            {social.twitterCard.card && <div style={{ marginBottom: '4px' }}><strong>Type:</strong> {social.twitterCard.card}</div>}
                            {social.twitterCard.site && <div><strong>Site:</strong> {social.twitterCard.site}</div>}
                        </div>
                    </AccordionItem>
                </div>

                {/* Structured Data Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#586069', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Schema.org
                        </div>
                        <div style={{ fontSize: '12px', color: schemaList.length > 0 ? 'var(--color-status-good)' : '#999' }}>
                            {schemaList.length > 0 ? `${schemaList.length} items detected` : 'None detected'}
                        </div>
                    </div>

                    {schemaList.length > 0 ? (
                        <div>
                            {schemaList.map((item, i) => (
                                <SchemaItem key={i} data={item} />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: '6px',
                            color: '#666',
                            fontSize: '13px',
                            border: '1px dashed #ddd'
                        }}>
                            No structured data found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialTechCheck;
