import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import type { JSONContent } from "@tiptap/react";

const EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Image,
  Link.configure({ openOnClick: false, autolink: true }),
];

export function TiptapRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return null;
  const html = generateHTML(content as JSONContent, EXTENSIONS);
  return (
    <div
      className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-primary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
