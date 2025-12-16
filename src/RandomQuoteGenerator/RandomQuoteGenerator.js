const colorPairs = [
  ["#ff6b6b", "#1dd1a1"],
  ["#48dbfb", "#5f27cd"],
  ["#feca57", "#2e86de"],
  ["#ee5253", "#00d2d3"],
  ["#ff9f43", "#341f97"],
  ["#10ac84", "#576574"]
];

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * colorPairs.length);
  return colorPairs[randomIndex];
}

async function getNewRandomQuote() {
  let colorCombo = getRandomColor();

  try {
    document.getElementById('random-quote-text').textContent = "Loading...";
    document.getElementById('random-quote-author').textContent = "";

    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();

    document.getElementById('random-quote-text').textContent = data.content;
    document.getElementById('random-quote-author').textContent = `— ${data.author}`;
  } catch (error) {
    console.error("Error fetching quote:", error);
    document.getElementById('random-quote-text').textContent = "Oops, couldn't fetch a quote.";
    document.getElementById('random-quote-author').textContent = "";
  } finally {
    // Always apply gradient
    const el = document.getElementById('random-quote-generator');
    if (el) {
      el.style.background = `linear-gradient(45deg, ${colorCombo[0]}, ${colorCombo[1]})`;
    }
  }
}