import { useCallback, useState } from 'react';
import apiClient from '../api/client';

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function useUpload() {
    const [file, setFile] = useState(null);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [summary, setSummary] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const validateEmail = (val) => {
        if (!val) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
        return '';
    };

    const handleFileChange = useCallback((selectedFile) => {
        if (!selectedFile) return;

        const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_TYPES.includes(ext)) {
            setErrorMessage(`Unsupported file type. Please upload a CSV or XLSX file.`);
            setStatus('error');
            return;
        }
        if (selectedFile.size > MAX_SIZE_BYTES) {
            setErrorMessage('File is too large. Maximum size is 10 MB.');
            setStatus('error');
            return;
        }

        setFile(selectedFile);
        setStatus('idle');
        setErrorMessage('');
    }, []);

    const handleEmailChange = useCallback((val) => {
        setEmail(val);
        if (emailError) setEmailError(validateEmail(val));
    }, [emailError]);

    const removeFile = useCallback(() => {
        setFile(null);
        setStatus('idle');
        setErrorMessage('');
    }, []);

    const reset = useCallback(() => {
        setFile(null);
        setEmail('');
        setEmailError('');
        setStatus('idle');
        setSummary('');
        setErrorMessage('');
    }, []);

    const handleSubmit = useCallback(async () => {
        // Validate
        const emailErr = validateEmail(email);
        if (emailErr) { setEmailError(emailErr); return; }
        if (!file) return;

        setStatus('loading');
        setErrorMessage('');
        setSummary('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('recipient_email', email);

        try {
            const { data } = await apiClient.post('/api/v1/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSummary(data.summary);
            setStatus('success');
        } catch (err) {
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
            setStatus('error');
        }
    }, [file, email]);

    return {
        file, email, emailError, status, summary, errorMessage,
        handleFileChange, handleEmailChange, handleSubmit, removeFile, reset,
        canSubmit: Boolean(file && email && status !== 'loading'),
    };
}
