import {
  VerticalAlignContainer,
  VerticalAlignContent,
} from './StockAnalysisDashboard'
import Styled from 'styled-components'
import { PrimaryColor } from './StockAnalysisDashboard'
import numabbr from 'numabbr';

const NumberDisplay = Styled.div`
color: ${PrimaryColor};
font-size: 20px;
`
const LabelStyle = Styled.div`
font-size: 12px;
`

function NumberStat({value,label,center}: { value: number, label: string,center?:boolean }) {

  return (
  <VerticalAlignContainer style={{textAlign: center ? 'center' : 'left'}}>
    <VerticalAlignContent>
      <NumberDisplay>{numabbr(value)}</NumberDisplay>
      <LabelStyle>{label}</LabelStyle>
    </VerticalAlignContent>
  </VerticalAlignContainer>
  )
}

export default NumberStat