import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MarkdownLink from "@/components/blog/MarkdownLink";
import MarkdownHeading from "@/components/blog/MarkdownHeading";

interface PageMarkdownProps {
  markdown: string;
  className?: string;
}

/** Shared Markdown renderer for Contentful-managed site pages. */
const PageMarkdown: React.FC<PageMarkdownProps> = ({
  markdown,
  className,
}) => {
  if (!markdown?.trim()) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <MarkdownLink href={href || "#"}>{children}</MarkdownLink>
          ),
          h2: ({ children }) => (
            <MarkdownHeading level={2}>{children}</MarkdownHeading>
          ),
          h3: ({ children }) => (
            <MarkdownHeading level={3}>{children}</MarkdownHeading>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default PageMarkdown;
