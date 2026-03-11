import { AlertCircle, Mail } from 'lucide-react';

export default function EmailInput({ value, onChange, error, disabled }) {
    return (
        <div className="form-group">
            <label htmlFor="recipient-email">Recipient Email</label>
            <div style={{ position: 'relative' }}>
                <Mail
                    size={15}
                    style={{
                        position: 'absolute', left: '14px', top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                        pointerEvents: 'none',
                    }}
                />
                <input
                    id="recipient-email"
                    type="email"
                    className={`input ${error ? 'error' : ''}`}
                    style={{ paddingLeft: '38px' }}
                    placeholder="executive@company.com"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    autoComplete="email"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'email-error' : undefined}
                />
            </div>
            {error && (
                <p className="input-error-msg" id="email-error" role="alert">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}
        </div>
    );
}
