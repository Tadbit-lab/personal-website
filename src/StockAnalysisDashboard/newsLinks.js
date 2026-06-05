import { jsx as _jsx } from "react/jsx-runtime";
/**
 * List of news article links. Plain CSS, no styled-components.
 */
const NewsList = ({ newsLinks }) => {
    if (!newsLinks || newsLinks.length === 0) {
        return _jsx("div", { style: { color: 'var(--text-muted)', fontSize: '0.8125rem' }, children: "No news available" });
    }
    return (_jsx("div", { children: newsLinks.map((news, index) => (_jsx("a", { className: "news-link-item", href: news.link, target: "_blank", rel: "noopener noreferrer", title: news.title, children: news.title }, index))) }));
};
export default NewsList;
