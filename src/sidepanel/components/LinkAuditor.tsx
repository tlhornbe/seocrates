import React, { useState } from 'react';
import type { LinkAnalysis } from '../../types';

interface LinkAuditorProps {
    links: LinkAnalysis;
}

const LinkAuditor: React.FC<LinkAuditorProps> = ({ links }) => {
    const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

    const activeLinks = activeTab === 'internal' ? links.internal : links.external;

    return (
        <div className="card">
            <div className="card-header">
                <span>Link Auditor</span>
                <div style={{ fontSize: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>{links.counts.total}</span> Total
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                    onClick={() => setActiveTab('internal')}
                    style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: activeTab === 'internal' ? 'var(--color-primary-navy)' : '#eee',
                        color: activeTab === 'internal' ? 'white' : '#333',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}
                >
                    Internal ({links.counts.internal})
                </button>
                <button
                    onClick={() => setActiveTab('external')}
                    style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: activeTab === 'external' ? 'var(--color-primary-navy)' : '#eee',
                        color: activeTab === 'external' ? 'white' : '#333',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}
                >
                    External ({links.counts.external})
                </button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #ddd', minWidth: '150px' }}>Anchor</th>
                            <th style={{ textAlign: 'left', padding: '6px', borderBottom: '2px solid #ddd', minWidth: '200px' }}>Destination</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeLinks.map((link, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '6px', whiteSpace: 'nowrap' }} title={link.anchor}>
                                    {link.anchor}
                                </td>
                                <td style={{ padding: '6px', whiteSpace: 'nowrap' }} title={link.href}>
                                    {link.href}
                                </td>
                            </tr>
                        ))}
                        {activeLinks.length === 0 && (
                            <tr>
                                <td colSpan={2} style={{ padding: '12px', textAlign: 'center', color: '#999' }}>No links found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LinkAuditor;
