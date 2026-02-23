import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FormattedMarkdownProps {
  text: string;
}

export default function FormattedMarkdown({ text }: FormattedMarkdownProps) {
  return (
    <div className="pi-formatted-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
