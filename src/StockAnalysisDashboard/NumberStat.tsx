import {
  VerticalAlignContainer,
  VerticalAlignContent,
} from './StockAnalysisDashboard'
import Styled from 'styled-components'

const NumberDisplay = Styled.div`
color: blue;
font-size: 20px;
`

function NumberStat({value,label}: { value: number, label: string }) {

  return (
  <VerticalAlignContainer>
    <VerticalAlignContent>
      <NumberDisplay>{value}</NumberDisplay>
      <div>{label}</div>
    </VerticalAlignContent>
  </VerticalAlignContainer>
  )
}

export default NumberStat