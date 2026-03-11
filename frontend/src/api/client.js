import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    timeout: 120_000, // 2 minutes — AI + email can take time
    headers: {
        Accept: 'application/json',
    },
});

// Response error normalizer
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const detail =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            'An unexpected error occurred.';
        return Promise.reject(new Error(detail));
    }
);

export default apiClient;
