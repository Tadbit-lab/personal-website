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
  try {
    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();

    const quoteText = data.content;
    const quoteAuthor = data.author;

    document.getElementById('random-quote-text').innerHTML = quoteText;
    document.getElementById('random-quote-author').innerHTML = quoteAuthor;

    // ✅ Get a random color pair and apply gradient
    const colorCombo = getRandomColor();
    document.getElementById('random-quote-generator').style.background = 
      `linear-gradient(45deg, ${colorCombo[0]}, ${colorCombo[1]})`;
  } catch (error) {
    console.error("Error fetching quote:", error);
  }
}