import { useCallback, useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ file, onFileChange, onRemove, disabled }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFileChange(dropped);
    }, [onFileChange]);

    const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    const handleInputChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) onFileChange(selected);
        e.target.value = '';
    };

    return (
        <div className="form-group">
            <label>Sales Data File</label>

            <div
                className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDrop={disabled ? undefined : handleDrop}
                onDragOver={disabled ? undefined : handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !file && !disabled && inputRef.current?.click()}
                role="button"
                tabIndex={file || disabled ? -1 : 0}
                aria-label="File upload zone"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    disabled={disabled}
                    aria-hidden="true"
                />

                {!file ? (
                    <>
                        <div className="upload-icon">
                            <Upload size={22} />
                        </div>
                        <p className="upload-primary-text">Drop your file here</p>
                        <p className="upload-secondary-text">
                            or <span onClick={() => inputRef.current?.click()}>browse to upload</span>
                        </p>
                        <p className="upload-accepted">Accepts: .csv, .xlsx, .xls · Max 10 MB</p>
                    </>
                ) : (
                    <>
                        <div className="upload-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <FileSpreadsheet size={22} />
                        </div>
                        <p className="upload-primary-text">File selected</p>
                    </>
                )}
            </div>

            {file && (
                <div className="file-info">
                    <div className="file-info-icon">
                        <FileSpreadsheet size={18} />
                    </div>
                    <span className="file-info-name" title={file.name}>{file.name}</span>
                    <span className="file-info-size">{formatBytes(file.size)}</span>
                    {!disabled && (
                        <button className="file-remove" onClick={onRemove} aria-label="Remove file">
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
