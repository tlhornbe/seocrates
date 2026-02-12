import React from 'react';
import type { AnalysisResult } from '../../types';

interface HeaderProps {
    data: AnalysisResult;
}

const Header: React.FC<HeaderProps> = ({ data }) => {
    const { title, description, robots, wordCount } = data;

    return (
        <div className="card">
            <div className="card-header">
                <span>Page Information</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-primary-navy)' }}>Page Title</div>
                <div style={{ fontSize: '14px', marginBottom: '4px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {title.text || <em style={{ color: '#999' }}>Missing</em>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`tag ${title.status}`}>
                        {title.length} chars
                    </div>
                    {title.reason && title.status !== 'good' && (
                        <span style={{ fontSize: '11px', color: '#d9534f' }}>
                            {title.reason}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-primary-navy)' }}>Meta Description</div>
                <div style={{ fontSize: '13px', color: '#444', marginBottom: '4px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {description.text || <em style={{ color: '#999' }}>Missing</em>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`tag ${description.status}`}>
                        {description.length} chars
                    </div>
                    {description.reason && description.status !== 'good' && (
                        <span style={{ fontSize: '11px', color: '#d9534f' }}>
                            {description.reason}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-primary-navy)', marginBottom: '4px' }}>Indexability</div>
                    <div>
                        <span className={`tag ${robots.isIndexable ? 'good' : 'error'}`}>
                            {robots.isIndexable ? 'Indexable' : 'NoIndex'}
                        </span>
                    </div>
                </div>

                {wordCount > 0 && (
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-primary-navy)', marginBottom: '4px' }}>Word Count</div>
                        <div style={{ fontSize: '13px', color: '#444' }}>
                            {wordCount.toLocaleString()} words
                        </div>
                    </div>
                )}

                {data.readability && (
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-primary-navy)', marginBottom: '4px' }}>Reading Level</div>
                        <div style={{ fontSize: '13px', color: '#444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 500 }}>{data.readability.grade}</span>
                            <span style={{
                                fontSize: '11px',
                                color: data.readability.color || '#666',
                                background: '#fafafa',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: `1px solid ${data.readability.color || '#eee'}`,
                                fontWeight: 600
                            }}>
                                {data.readability.score} / 18
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
