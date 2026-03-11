import { useState } from 'react';
import { Check, Copy, FileText } from 'lucide-react';

export default function SummaryPreview({ summary }) {
    const [copied, setCopied] = useState(false);

    if (!summary) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = summary;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="summary-preview">
            <div className="summary-header">
                <span className="summary-title">
                    <FileText size={14} />
                    Executive Summary
                </span>
                <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                    aria-label="Copy summary to clipboard"
                >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>
            <div className="summary-body" aria-label="AI generated executive summary">
                {summary}
            </div>
        </div>
    );
}
