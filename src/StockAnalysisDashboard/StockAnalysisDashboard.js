import styled from 'styled-components';
/* ===========================
   API CALL
=========================== */
export async function analyzeStock(stockSymbolToAnalyze) {
    try {
        const API_BASE = `http://${window.location.hostname}:5000`;
        const response = await fetch(`${API_BASE}/analyze-stock/${stockSymbolToAnalyze}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }
    catch (err) {
        console.error(err);
        return null;
    }
}
/* ===========================
   LAYOUT COMPONENTS (FIXED)
=========================== */
export const VerticalAlignContainer = styled.div `
  width: 100%;
  justify-content: center;
`;
export const VerticalAlignContent = styled.div `
  width: 100%;
`;
export const DashboardGridContainer = styled.div `
  width: auto;
  margin: 0 auto;
  border: ;
  min-height: max-content;
`;
export const DashboardGridContent = styled.div `
  border-radius: 8px;
  background-color: White;
  padding: 5px;
  color: BLACK;
`;
export const PrimaryColor = '#4A90E2';
export const StickyTitle = styled.div `
  position: sticky;
  top: 0;
  color: ${PrimaryColor}
`;
export const GridNoScroll = styled.div `
  .grid-stack {
    height: auto !important;
    min-height: max-content !important;
    overflow: visible !important;
  }

  .grid-stack-item {
    overflow: visible !important;
  }
`;
