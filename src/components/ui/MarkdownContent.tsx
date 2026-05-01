import React from "react";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-text-primary font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export default function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      nodes.push(
        <h2
          key={i}
          className="font-cinzel text-xl font-semibold text-text-primary mt-8 mb-4 first:mt-0"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h3
          key={i}
          className="font-semibold text-text-primary text-base mt-6 mb-3"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(
          <li key={i} className="text-text-secondary leading-relaxed">
            {renderInline(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={`ul${i}`} className="list-disc list-inside space-y-1.5 my-4 pl-1">
          {items}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="text-text-secondary leading-relaxed">
            {renderInline(lines[i].replace(/^\d+\.\s/, ""))}
          </li>
        );
        i++;
      }
      nodes.push(
        <ol key={`ol${i}`} className="list-decimal list-inside space-y-1.5 my-4 pl-1">
          {items}
        </ol>
      );
      continue;
    } else if (line.trim()) {
      nodes.push(
        <p key={i} className="text-text-secondary leading-relaxed mb-4">
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return <div className="space-y-1">{nodes}</div>;
}
