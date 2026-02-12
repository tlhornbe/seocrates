import type { AnalysisResult } from '../types';

export const generateHTMLReport = (data: AnalysisResult): string => {
    const { title, description, robots, headings, links, social, canonical, wordCount, readability } = data;
    const date = new Date().toLocaleString();

    // Helper for colors
    const navy = '#0e2a47';
    const red = '#d93025';
    const green = '#1e8e3e';
    const gray = '#5f6368';
    const gold = '#c5a049';

    const titleColor = title.status === 'good' ? green : (title.status === 'warning' ? '#f9ab00' : red);
    const descColor = description.status === 'good' ? green : (description.status === 'warning' ? '#f9ab00' : red);

    // Extract Schema Types for the Tech Meta section
    const schemaTypes = social.schemaOrg.data.map((s: any) => s['@type']).flat().filter(Boolean).join(', ') || 'None';

    let html = `
    <div style="font-family: Arial, sans-serif; color: #202124; max-width: 800px; line-height: 1.5;">
      
      <!-- Header: Solid Gold Line -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
            <td style="width: 50px; vertical-align: middle; padding-bottom: 12px;">
                <span style="font-size: 32px;">🦉</span>
            </td>
            <td style="vertical-align: middle; padding-bottom: 12px;">
                <h1 style="color: ${navy}; margin: 0; font-size: 26px;">SEOCrates Audit Report</h1>
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border-top: 5px solid ${gold}; padding: 0; margin: 0; height: 1px;">&nbsp;</td>
        </tr>
      </table>

      <p style="color: ${gray}; font-size: 11px; margin-top: -15px; margin-bottom: 25px;">Generated on: ${date}</p>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 20px; margin-top: 30px;">1. Page Information</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 160px; vertical-align: top; color: ${navy};">Page Title</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: 500; margin-bottom: 2px; color: #000;">${title.text || '<em>Missing</em>'}</div>
                <div style="font-size: 12px; color: ${titleColor};">
                    (${title.length} chars) - ${title.status.toUpperCase()} 
                    ${title.reason ? `<span style="color: ${gray}; margin-left:8px;">• ${title.reason}</span>` : ''}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; vertical-align: top; color: ${navy};">Meta Description</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: 500; margin-bottom: 2px; color: #000;">${description.text || '<em>Missing</em>'}</div>
                <div style="font-size: 12px; color: ${descColor};">
                    (${description.length} chars) - ${description.status.toUpperCase()}
                    ${description.reason ? `<span style="color: ${gray}; margin-left:8px;">• ${description.reason}</span>` : ''}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${navy};">Canonical URL</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <div style="color: ${canonical.isMatch ? green : '#d35400'}; font-weight: bold; margin-bottom: 4px;">
                    ${canonical.isMatch ? '✅ Matches URL' : '⚠️ Mismatch Found'}
                </div>
                ${!canonical.isMatch ? `
                    <div style="font-size: 11px; color: ${gray};">Current URL: ${canonical.currentUrl}</div>
                    <div style="font-size: 11px; color: ${navy}; font-weight: 500;">Target: ${canonical.href}</div>
                ` : `
                    <div style="font-size: 11px; color: ${gray};">Target: ${canonical.href}</div>
                `}
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${navy};">Indexability</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: ${robots.isIndexable ? green : red}; font-weight: bold;">
                ${robots.isIndexable ? 'Indexable' : 'NoIndex detected'}
            </td>
        </tr>
      </table>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 35px; font-size: 20px;">2. Content Metrics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 160px; color: ${navy};">Word Count</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${wordCount.toLocaleString()} words</td>
        </tr>
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${navy};">Reading Level</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="background: ${readability.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; font-weight: bold;">Score ${readability.score} / 18</span>
                <span style="color: ${gray}; font-size: 13px;">${readability.grade}</span>
            </td>
        </tr>
      </table>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 35px; font-size: 20px;">3. Heading Structure</h2>
      <div style="margin-left: 0; margin-bottom: 30px; margin-top: 15px;">
  `;

    if (headings.length === 0) {
        html += `<p style="color: ${gray}; font-style: italic;">No headings found.</p>`;
    } else {
        headings.forEach(h => {
            const indent = (h.level - 1) * 24; // Increased indent to 24px
            const errorText = h.error ? ` <span style="color: ${red}; font-size: 11px; margin-left: 8px;">⚠️ ${h.error}</span>` : '';

            html += `
        <div style="padding: 1px 0; margin-bottom: 2px; margin-left: ${indent}px; font-size: 13px; line-height: 1.3;">
          <strong style="color: ${navy}; font-size: 12px; margin-right: 6px;">H${h.level}</strong>
          <span style="color: #333;">${h.text || '<em>Empty</em>'}</span>
          ${errorText}
        </div>
      `;
        });
    }

    html += `
      </div>

      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 35px; font-size: 20px;">4. Link Overview</h2>
      <p style="margin-bottom: 15px; color: ${gray}; font-size: 13px;">
         <strong>Total Links:</strong> ${links.counts.total} (Internal: ${links.counts.internal} | External: ${links.counts.external})
      </p>

      <div style="margin-top: 10px;">
           <h3 style="font-size: 15px; margin-bottom: 8px; color: ${navy};">Internal Links (${links.internal.length})</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
                ${links.internal.map(l => `
                    <tr>
                        <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 30%; font-weight: 500; color: #202124; border-bottom: 1px solid #fafafa;">${l.anchor || '<em>No Text</em>'}</td>
                        <td style="padding: 5px 0; color: ${gray}; word-break: break-all; border-bottom: 1px solid #fafafa;">${l.href}</td>
                    </tr>
                `).join('')}
           </table>

           <h3 style="font-size: 15px; margin-bottom: 8px; color: ${navy};">External Links (${links.external.length})</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
                ${links.external.map(l => `
                    <tr>
                        <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 30%; font-weight: 500; color: #202124; border-bottom: 1px solid #fafafa;">${l.anchor || '<em>No Text</em>'}</td>
                        <td style="padding: 5px 0; color: ${gray}; word-break: break-all; border-bottom: 1px solid #fafafa;">${l.href}</td>
                    </tr>
                `).join('')}
           </table>
      </div>
      
      <h2 style="color: ${navy}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 35px; font-size: 20px;">5. Technical & Social Meta</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px;">
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 160px; color: ${navy};">Open Graph</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                ${social.openGraph.exists ? '✅ Found' : '❌ Missing'}
            </td>
        </tr>
         <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${navy};">Twitter Card</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                ${social.twitterCard.exists ? '✅ Found' : '❌ Missing'}
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${navy};">Schema Types</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: ${gray};">
                ${schemaTypes}
            </td>
        </tr>
      </table>

    </div>
  `;

    return html;
};
