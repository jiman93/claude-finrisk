import ReactMarkdown from "react-markdown";

interface FormattedMarkdownProps {
  text: string;
}

export default function FormattedMarkdown({ text }: FormattedMarkdownProps) {
  return (
    <div className="pi-formatted-markdown">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
