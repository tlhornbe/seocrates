import React from 'react';
import type { HeadingItem } from '../../types';

interface HeadingOutlineProps {
    headings: HeadingItem[];
}

const HeadingOutline: React.FC<HeadingOutlineProps> = ({ headings }) => {
    return (
        <div className="card">
            <div className="card-header">
                <span>Heading Structure</span>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>{headings.length} tags</span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {headings.length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic' }}>No headings found.</div>
                ) : (
                    headings.map((h, i) => (
                        <div key={i} style={{
                            paddingLeft: `${(h.level - 1) * 12}px`,
                            marginBottom: '6px',
                            fontSize: '13px',
                            borderLeft: h.error ? '2px solid var(--color-status-error)' : '2px solid transparent'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                {/* Cohesion Dot */}
                                <span style={{
                                    fontWeight: 'bold',
                                    color: h.level === 1 ? 'var(--color-primary-navy)' : '#555',
                                    marginRight: '6px',
                                    minWidth: '24px'
                                }}>H{h.level}</span>
                                <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.4' }}>
                                    {h.text || <em style={{ color: '#ccc' }}>Empty</em>}
                                </span>
                            </div>
                            {h.error && (
                                <div style={{ color: 'var(--color-status-error)', fontSize: '11px', marginLeft: '30px' }}>
                                    ⚠ {h.error}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HeadingOutline;
