/* ===========================
   API
   =========================== */
// TODO(security): API_BASE should ideally come from an environment variable
// for production deployment. Hardcoded here for simplicity.
const API_BASE = 'https://text-analysis-tool-a0kx.onrender.com';
export async function analyzeStock(stockSymbolToAnalyze) {
    const response = await fetch(`${API_BASE}/analyze-stock/${encodeURIComponent(stockSymbolToAnalyze)}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
}
/* ===========================
   PRIMARY COLOR (used by chart configs)
   =========================== */
export const PrimaryColor = '#2563EB';
