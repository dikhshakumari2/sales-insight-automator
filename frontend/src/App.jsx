import { BarChart2, RefreshCw, Send, Sparkles } from 'lucide-react';
import EmailInput from './components/EmailInput';
import FileUpload from './components/FileUpload';
import StatusCard from './components/StatusCard';
import SummaryPreview from './components/SummaryPreview';
import { useUpload } from './hooks/useUpload';
import './index.css';

const STEPS = [
    { key: 'upload', label: '1. Upload' },
    { key: 'send', label: '2. Analyze' },
    { key: 'result', label: '3. Result' },
];

function getActiveStep(status) {
    if (status === 'idle') return 'upload';
    if (status === 'loading') return 'send';
    return 'result';
}

export default function App() {
    const {
        file, email, emailError, status, summary, errorMessage,
        handleFileChange, handleEmailChange, handleSubmit, removeFile, reset,
        canSubmit,
    } = useUpload();

    const activeStep = getActiveStep(status);

    return (
        <div className="app">
            {/* ── Header ── */}
            <header className="app-header">
                <div className="app-logo">📊</div>
                <h1 className="app-title">Sales Insight Automator</h1>
                <p className="app-subtitle">
                    Upload your sales dataset · Get an AI-powered executive summary · Delivered straight to your inbox
                </p>
            </header>

            {/* ── Main Card ── */}
            <main className="card" aria-label="Sales analysis form">
                {/* Step indicator */}
                <div className="steps" role="tablist" aria-label="Progress steps">
                    {STEPS.map((s) => (
                        <div
                            key={s.key}
                            className={`step ${s.key === activeStep ? 'active' : ''} ${(s.key === 'upload' && (activeStep === 'send' || activeStep === 'result')) ||
                                    (s.key === 'send' && activeStep === 'result')
                                    ? 'done'
                                    : ''
                                }`}
                            role="tab"
                            aria-selected={s.key === activeStep}
                        >
                            {s.label}
                        </div>
                    ))}
                </div>

                {status === 'success' ? (
                    /* ── Success view ── */
                    <>
                        <StatusCard status="success" />
                        <SummaryPreview summary={summary} />
                        <div className="divider" />
                        <button className="btn btn-primary" onClick={reset}>
                            <RefreshCw size={16} />
                            Analyze Another File
                        </button>
                    </>
                ) : (
                    /* ── Form view ── */
                    <>
                        <FileUpload
                            file={file}
                            onFileChange={handleFileChange}
                            onRemove={removeFile}
                            disabled={status === 'loading'}
                        />
                        <EmailInput
                            value={email}
                            onChange={handleEmailChange}
                            error={emailError}
                            disabled={status === 'loading'}
                        />

                        {(status === 'loading' || status === 'error') && (
                            <>
                                <div className="divider" />
                                <StatusCard status={status} errorMessage={errorMessage} />
                            </>
                        )}

                        <div className={status === 'loading' || status === 'error' ? '' : 'divider'} style={status === 'idle' ? undefined : { marginTop: '16px' }} />

                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            aria-busy={status === 'loading'}
                        >
                            {status === 'loading' ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Analyzing…
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Analyze &amp; Send Summary
                                    <Send size={14} style={{ marginLeft: 2 }} />
                                </>
                            )}
                        </button>

                        <div style={{ marginTop: '16px' }} />

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span className="badge badge-purple">
                                <BarChart2 size={11} />
                                Powered by Google Gemini AI
                            </span>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
