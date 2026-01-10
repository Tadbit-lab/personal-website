import styled from 'styled-components';

/* ===========================
   API CALL
=========================== */
export async function analyzeStock(stockSymbolToAnalyze: string) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/analyze-stock/${stockSymbolToAnalyze}`
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
   LAYOUT COMPONENTS (FIXED)
=========================== */

export const VerticalAlignContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
`;

export const VerticalAlignContent = styled.div`
  width: 100%;
`;

export const DashboardGridContainer = styled.div`
  width: 80%;
  height: 30%;
  margin: 0 auto;
  border: 1px solid red;
`;

export const DashboardGridContent= styled.div`
  border-radius: 8px;
  background-color: White;
  padding: 15px;
  color: BLACK;
  height: 100%;
  `;