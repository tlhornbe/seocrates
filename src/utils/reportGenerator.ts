import type { AnalysisResult } from '../types';

export const generateHTMLReport = (data: AnalysisResult): string => {
  const { title, description, robots, headings, links, social, canonical, wordCount, readability } = data;
  const date = new Date().toLocaleString();

  // Helper for colors
  const navy = '#0e2a47';
  const red = '#d93025';
  const green = '#1e8e3e';
  const gray = '#5f6368';
  const googleBlue = '#1a0dab';
  const gold = '#c5a049';

  const titleColor = title.status === 'good' ? green : (title.status === 'warning' ? '#f9ab00' : red);
  const descColor = description.status === 'good' ? green : (description.status === 'warning' ? '#f9ab00' : red);

  // Extract Schema Types
  const schemaTypes = social.schemaOrg.data.map((s: any) => s['@type']).flat().join(', ') || 'None';

  let html = `
    <div style="font-family: Arial, sans-serif; color: #202124; max-width: 800px; line-height: 1.5;">
      <div style="display: flex; align-items: center; border-bottom: 2px solid ${gold}; padding-bottom: 8px; margin-bottom: 20px;">
        <span style="font-size: 24px; margin-right: 10px;">🦉</span>
        <h1 style="color: ${navy}; margin: 0; font-size: 24px;">SEOCrates Audit Report</h1>
      </div>
      <p style="color: ${gray}; font-size: 12px; margin-top: -10px; margin-bottom: 20px;">Generated on: ${date}</p>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px;">1. Executive Summary</h2>
      
      <!-- Content Metrics Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold; width: 150px;">Word Count</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${wordCount} words</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Reading Level</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
                ${readability.grade} <span style="color: ${gray}; font-size: 12px;">(Grade ${readability.score})</span>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Indexability</td>
            <td style="padding: 8px; border: 1px solid #ddd; color: ${robots.isIndexable ? green : red}; font-weight: bold;">
                ${robots.isIndexable ? 'Indexable' : 'NoIndex found'}
            </td>
        </tr>
      </table>

      <!-- Google SERP Visual -->
      <h3 style="font-size: 16px; margin-bottom: 10px; color: ${navy};">Google SERP Preview</h3>
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #dfe1e5; border-radius: 8px; background: #fff; max-width: 600px;">
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
             <div style="width: 26px; height: 26px; background: #f1f3f4; border-radius: 50%; display: flex; align-items: center; justifyContent: center; margin-right: 12px; font-size: 12px; color: #555;">G</div>
             <div style="display: flex; flex-direction: column;">
                <span style="font-size: 14px; color: #202124; line-height: 1.3;">${canonical.currentUrl ? new URL(canonical.currentUrl).hostname : 'example.com'}</span>
                <span style="font-size: 12px; color: #5f6368; line-height: 1.3;">${data.canonical?.currentUrl || 'https://example.com'}</span>
             </div>
        </div>
        <div style="font-size: 20px; color: ${googleBlue}; cursor: pointer; margin-bottom: 4px; line-height: 1.3;">
            ${title.text || 'Missing Title'}
        </div>
        <div style="font-size: 14px; color: #4d5156; line-height: 1.58;">
            ${description.text || 'No description provided.'}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold; width: 140px;">Page Title</td>
          <td style="padding: 8px;">
            <div style="font-size: 12px; color: ${titleColor};">(${title.length} chars) - ${title.status.toUpperCase()}</div>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold;">Meta Desc</td>
          <td style="padding: 8px;">
            <div style="font-size: 12px; color: ${descColor};">(${description.length} chars) - ${description.status.toUpperCase()}</div>
          </td>
        </tr>
      </table>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">2. Heading Structure</h2>
      <div style="margin-left: 10px; margin-bottom: 20px;">
  `;

  if (headings.length === 0) {
    html += `<p style="color: ${gray}; font-style: italic;">No headings found.</p>`;
  } else {
    headings.forEach(h => {
      const indent = (h.level - 1) * 20;
      const errorStyle = h.error ? `color: ${red}; font-weight: bold;` : '';
      const errorText = h.error ? ` <span style="background: #fce8e6; color: ${red}; padding: 2px 4px; font-size: 11px;">⚠️ ${h.error}</span>` : '';

      html += `
        <div style="margin-left: ${indent}px; margin-bottom: 4px; font-size: 13px; ${errorStyle}">
          <span style="color: ${navy}; font-weight: bold;">H${h.level}</span>: ${h.text || '<em>Empty</em>'}
          ${errorText}
        </div>
      `;
    });
  }

  html += `
      </div>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">3. Link Overview</h2>
      <p><strong>Total Links:</strong> ${links.counts.total} (Internal: ${links.counts.internal} | External: ${links.counts.external})</p>

      <div style="margin-top: 15px;">
           <h3 style="font-size: 14px; margin-bottom: 8px; color: ${navy};">Internal Links (${links.internal.length})</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border: 1px solid #ddd;">
                <tr style="background: #f1f3f4; border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 8px; width: 40%; border-right: 1px solid #ddd;">Anchor Text</th>
                     <th style="text-align: left; padding: 8px;">Destination URL</th>
                </tr>
                ${links.internal.map(l => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px; vertical-align: top; border-right: 1px solid #ddd;">${l.anchor || '<em>No Text</em>'}</td>
                        <td style="padding: 8px; color: ${gray}; word-break: break-all;">${l.href}</td>
                    </tr>
                `).join('')}
           </table>

           <h3 style="font-size: 14px; margin-bottom: 8px; color: ${navy};">External Links (${links.external.length})</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border: 1px solid #ddd;">
                <tr style="background: #f1f3f4; border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 8px; width: 40%; border-right: 1px solid #ddd;">Anchor Text</th>
                     <th style="text-align: left; padding: 8px;">Destination URL</th>
                </tr>
                ${links.external.map(l => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px; vertical-align: top; border-right: 1px solid #ddd;">${l.anchor || '<em>No Text</em>'}</td>
                        <td style="padding: 8px; color: ${gray}; word-break: break-all;">${l.href}</td>
                    </tr>
                `).join('')}
           </table>
      </div>
      
      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">4. Technical Checks</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; font-weight: bold; width: 150px;">Canonical URL</td>
            <td style="padding: 8px;">
                ${canonical.isMatch ? '✅ Matches URL' : '⚠️ <strong>Mismatch</strong>'}
                ${!canonical.isMatch && canonical.href ? `<div style="font-size:12px; color:${gray}; margin-top:2px;">Defined: ${canonical.href}</div>` : ''}
            </td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; font-weight: bold;">Schema.org</td>
            <td style="padding: 8px;">
                ${social.schemaOrg.exists ? '✅ Found' : '❌ Missing'}
                ${social.schemaOrg.exists ? `<div style="font-size:12px; color:${gray}; margin-top:2px;">Types: ${schemaTypes}</div>` : ''}
            </td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; font-weight: bold;">Open Graph</td>
            <td style="padding: 8px;">
                ${social.openGraph.exists ? '✅ Found' : '❌ Missing'}
            </td>
        </tr>
         <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; font-weight: bold;">Twitter Card</td>
            <td style="padding: 8px;">
                ${social.twitterCard.exists ? '✅ Found' : '❌ Missing'}
            </td>
        </tr>
      </table>
    </div>
  `;

  return html;
};
