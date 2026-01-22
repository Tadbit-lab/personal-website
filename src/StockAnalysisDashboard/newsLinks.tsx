import React from "react";
import styled from "styled-components";
import { PrimaryColor } from "./StockAnalysisDashboard";

type NewsLink = {
  title: string;
  link: string;
};

type NewsListProps = {
  newsLinks: NewsLink[];
};

const NewsList: React.FC<NewsListProps> = ({ newsLinks }) => {
  return (
    <ListContainer>
      {newsLinks.map((news, index) => (
        <NewsItem
          key={index}
          href={news.link}
          target="_blank"
          rel="noopener noreferrer"
          title={news.title}
        >
          {news.title}
        </NewsItem>
      ))}
    </ListContainer>
  );
};


/* =======================
   Styled Components
   ======================= */

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NewsItem = styled.a`
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