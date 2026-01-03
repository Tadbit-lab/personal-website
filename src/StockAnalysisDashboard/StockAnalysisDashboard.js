function analyzeStock() {
  const symbol = document.querySelector('.stock-analysis-dashboard-input').value.trim();

  if (symbol.length > 5) {
    alert("Stock symbol should not exceed 5 characters.");
    return;
  }

  if (!symbol) {
    alert("Please enter a stock symbol (e.g. MSFT).");
    return;
  }

  alert(`Analyzing stock: ${symbol}`);

  const url = 'http://127.0.0.1:5000/analyze-stock/' + symbol;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
      alert(`Stock Data for ${symbol}: ${JSON.stringify(data)}`);

      // ✅ Now data is defined here
      document.getElementById("stock-analysis-result").innerText =
        `Stock Data for ${symbol}: ${JSON.stringify(data)}`;
    })
    .catch(error => {
      console.error('Error fetching stock data:', error);
      alert('Failed to fetch stock data. Please try again later.');
    });
}

