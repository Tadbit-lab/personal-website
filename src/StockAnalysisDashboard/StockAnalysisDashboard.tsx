import styled from 'styled-components';

/* ===========================
   API CALL (NGROK + LOCAL SAFE)
=========================== */


// 🔹 LOCALHOST (Flask dev server)
// const API_BASE = 'http://127.0.0.1:5000';

// 🔹 LOCALHOST (Gunicorn)
// const API_BASE = 'http://127.0.0.1:8000';

// 🔹 NGROK (temporary tunnel)
// const API_BASE = 'https://your-ngrok-subdomain.ngrok-free.dev';

// 🔹 RENDER (PRODUCTION) ✅ ACTIVE
const API_BASE = 'https://text-analysis-tool-a0kx.onrender.com';


export async function analyzeStock(stockSymbolToAnalyze: string) {
  try {
    const response = await fetch(
      `${API_BASE}/analyze-stock/${stockSymbolToAnalyze}`
    );

    if (!response.ok) {
      console.error('API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Network error:', err);
    return null;
  }
}


/* ===========================
   LAYOUT COMPONENTS
=========================== */

export const VerticalAlignContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

export const VerticalAlignContent = styled.div`
  width: 100%;
`;

export const DashboardGridContainer = styled.div`
  width: auto;
  margin: 0 auto;
  min-height: max-content;
`;

export const DashboardGridContent = styled.div`
  border-radius: 8px;
  background-color: white;
  padding: 5px;
  color: black;
`;

export const PrimaryColor = '#4A90E2';

export const StickyTitle = styled.div`
  position: sticky;
  top: 0;
  background: white;
  color: ${PrimaryColor};
  z-index: 10;
`;

export const GridNoScroll = styled.div`
  .grid-stack {
    height: auto !important;
    min-height: max-content !important;
    overflow: visible !important;
  }

  .grid-stack-item {
    overflow: visible !important;
  }
`;
