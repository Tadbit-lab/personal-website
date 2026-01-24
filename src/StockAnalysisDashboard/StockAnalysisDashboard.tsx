import styled from 'styled-components';

/* ===========================
   API CALL (NGROK + LOCAL SAFE)
=========================== */

export async function analyzeStock(stockSymbolToAnalyze: string) {
  try {
    // Same-origin request (works with localhost, ngrok, production)
    const response = await fetch(
      `/analyze-stock/${stockSymbolToAnalyze}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(err);
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
