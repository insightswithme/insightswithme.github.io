import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, type Document } from "@contentful/rich-text-types";
import MarkdownLink from "@/components/blog/MarkdownLink";
import MarkdownImage from "@/components/blog/MarkdownImage";
import CodeBlock from "@/components/blog/CodeBlock";
import MarkdownHeading from "@/components/blog/MarkdownHeading";

type BlogPostBodyProps = {
  markdown?: string;
  richText?: Document | null;
};

function isDocument(value: unknown): value is Document {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Document).nodeType === "document" &&
      Array.isArray((value as Document).content)
  );
}

const richTextOptions = {
  renderNode: {
    [BLOCKS.HEADING_2]: (_node: unknown, children: React.ReactNode) => (
      <MarkdownHeading level={2}>{children}</MarkdownHeading>
    ),
    [BLOCKS.HEADING_3]: (_node: unknown, children: React.ReactNode) => (
      <MarkdownHeading level={3}>{children}</MarkdownHeading>
    ),
    [BLOCKS.PARAGRAPH]: (_node: unknown, children: React.ReactNode) => (
      <p>{children}</p>
    ),
    [BLOCKS.QUOTE]: (_node: unknown, children: React.ReactNode) => (
      <blockquote>{children}</blockquote>
    ),
    [BLOCKS.UL_LIST]: (_node: unknown, children: React.ReactNode) => (
      <ul>{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node: unknown, children: React.ReactNode) => (
      <ol>{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node: unknown, children: React.ReactNode) => (
      <li>{children}</li>
    ),
    [BLOCKS.HR]: () => <hr />,
    [BLOCKS.EMBEDDED_ASSET]: (node: {
      data?: { target?: { fields?: { file?: { url?: string }; title?: string } } };
    }) => {
      const file = node.data?.target?.fields?.file;
      const title = node.data?.target?.fields?.title || "";
      const url = file?.url
        ? file.url.startsWith("//")
          ? `https:${file.url}`
          : file.url
        : "";
      if (!url) return null;
      return <MarkdownImage src={url} alt={String(title)} />;
    },
    [INLINES.HYPERLINK]: (
      node: { data?: { uri?: string } },
      children: React.ReactNode
    ) => <MarkdownLink href={node.data?.uri || "#"}>{children}</MarkdownLink>,
  },
};

const BlogPostBody: React.FC<BlogPostBodyProps> = ({ markdown, richText }) => {
  if (isDocument(richText)) {
    return (
      <div className="blog-rich-text">
        {/* Options typing is looser than the SDK generics expect */}
        {documentToReactComponents(richText, richTextOptions as never)}
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: MarkdownLink,
        img: MarkdownImage,
        pre: ({ children, className }) => (
          <CodeBlock className={className}>{children}</CodeBlock>
        ),
        h2: ({ children }) => (
          <MarkdownHeading level={2}>{children}</MarkdownHeading>
        ),
        h3: ({ children }) => (
          <MarkdownHeading level={3}>{children}</MarkdownHeading>
        ),
      }}
    >
      {markdown || ""}
    </ReactMarkdown>
  );
};

export default BlogPostBody;
