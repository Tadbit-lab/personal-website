import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import './RandomQuoteGenerator.css';
export default function RandomQuoteGenerator() {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const fetchQuote = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const apiKey = import.meta.env.VITE_QUOTES_API_KEY;
            const headers = {};
            if (apiKey) {
                headers['X-Api-Key'] = apiKey;
            }
            let res = null;
            if (apiKey) {
                res = await fetch('https://api.api-ninjas.com/v1/quotes', { headers }).catch(() => null);
            }
            if (!res || !res.ok) {
                res = await fetch('https://api.quotable.io/random').catch(() => null);
            }
            if (!res || !res.ok) {
                res = await fetch('https://dummyjson.com/quotes/random').catch(() => null);
            }
            if (!res || !res.ok) {
                throw new Error('All quote API endpoints failed');
            }
            const data = await res.json();
            let text = '';
            let author = '';
            if (Array.isArray(data) && data.length > 0) {
                text = data[0].quote || data[0].text || '';
                author = data[0].author || 'Unknown';
            }
            else if (data && typeof data === 'object') {
                text = data.quote || data.content || data.text || '';
                author = data.author || 'Unknown';
            }
            if (!text) {
                throw new Error('Invalid quote payload');
            }
            setQuote({ text, author });
        }
        catch {
            setError(true);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);
    return (_jsxs("div", { className: "quote-container", children: [_jsx("div", { className: "quote-content", children: loading ? (_jsx("div", { className: "spinner" })) : error ? (_jsx("p", { className: "quote-error", children: "Unable to fetch quote." })) : quote ? (_jsxs(_Fragment, { children: [_jsxs("blockquote", { className: "quote-text", children: ["\"", quote.text, "\""] }), _jsxs("p", { className: "quote-author", children: ["\u2014 ", quote.author] })] })) : null }), _jsx("button", { type: "button", className: "quote-button", onClick: fetchQuote, disabled: loading, children: loading ? 'Fetching...' : 'New Quote' })] }));
}
