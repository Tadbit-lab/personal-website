export interface WordFrequency {
  word: string
  frequency: number
}

interface WordCloudProps {
  words: WordFrequency[]
}

function WordCloud({ words }: WordCloudProps) {
  const max = Math.max(...words.map(({ frequency }) => frequency), 1)
  const min = Math.min(...words.map(({ frequency }) => frequency), max)

  return (
    <div className="word-cloud" role="list" aria-label="Employee keyword themes">
      {words.map(({ word, frequency }) => {
        const ratio = max === min ? 1 : (frequency - min) / (max - min)
        return <span key={word} role="listitem" style={{ fontSize: `${.75 + ratio * .85}rem`, opacity: .58 + ratio * .42 }}>{word}</span>
      })}
    </div>
  )
}

export default WordCloud
