import { jsx as _jsx } from "react/jsx-runtime";
import styled from "styled-components";
import { PrimaryColor } from "./StockAnalysisDashboard";
const NewsList = ({ newsLinks }) => {
    return (_jsx(ListContainer, { children: newsLinks.map((news, index) => (_jsx(NewsItem, { href: news.link, target: "_blank", rel: "noopener noreferrer", title: news.title, children: news.title }, index))) }));
};
/* =======================
   Styled Components
   ======================= */
const ListContainer = styled.div `
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const NewsItem = styled.a `
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  max-width: 100%;
  font-size: 14px;
  color: ${PrimaryColor};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
export default NewsList;
