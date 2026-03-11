import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const CONFIG = {
    loading: {
        icon: <Loader2 size={26} className="spinner-icon" style={{ animation: 'spin 0.8s linear infinite' }} />,
        title: 'Analyzing Your Data…',
        message: 'We\'re parsing your dataset, generating AI insights, and sending the email. This may take up to a minute.',
    },
    success: {
        icon: <CheckCircle2 size={26} />,
        title: 'Analysis Complete!',
        message: 'Your executive summary has been generated and emailed to the recipient.',
    },
    error: {
        icon: <AlertCircle size={26} />,
        title: 'Something Went Wrong',
        message: null, // filled from errorMessage prop
    },
};

export default function StatusCard({ status, errorMessage }) {
    if (status === 'idle') return null;
    const cfg = CONFIG[status];

    return (
        <div className={`status-card ${status}`} role="status" aria-live="polite">
            <div className="status-icon">
                {status === 'loading' ? <div className="spinner" /> : cfg.icon}
            </div>
            <p className="status-title">{cfg.title}</p>
            <p className="status-message">
                {status === 'error' ? errorMessage : cfg.message}
            </p>
        </div>
    );
}
