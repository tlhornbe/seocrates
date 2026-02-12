import React from 'react';
import type { CanonicalStatus } from '../../types';

interface CanonicalCheckProps {
    canonical: CanonicalStatus;
}

const CanonicalCheck: React.FC<CanonicalCheckProps> = ({ canonical }) => {
    return (
        <div className="card">
            <div className="card-header">
                <span>Canonical Check</span>
            </div>

            {canonical.href ? (
                <div>
                    <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600' }}>Defined Canonical:</div>
                        <div style={{ wordBreak: 'break-all', color: '#555' }}>{canonical.href}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>Status:</span>
                        {canonical.isMatch ? (
                            <span className="tag good">Matches URL</span>
                        ) : (
                            <span className="tag warning">Mismatch</span>
                        )}
                    </div>
                    {!canonical.isMatch && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>Current URL:</div>
                            <div style={{ wordBreak: 'break-all' }}>{canonical.currentUrl}</div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ color: 'var(--color-status-error)', fontSize: '14px' }}>
                    ✕ No Canonical Tag Found
                </div>
            )}
        </div>
    );
};

export default CanonicalCheck;
