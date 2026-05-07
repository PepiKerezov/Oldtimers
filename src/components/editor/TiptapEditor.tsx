"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TOOLBAR_BTN =
  "px-2 py-1 text-sm rounded border border-transparent hover:border-border data-[active=true]:bg-primary data-[active=true]:text-primary-foreground";

function ToolbarButton({
  editor,
  onClick,
  isActive,
  children,
  ariaLabel,
}: {
  editor: Editor;
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      className={TOOLBAR_BTN}
      aria-label={ariaLabel}
      disabled={!editor.isEditable}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({
  initialContent,
  onChange,
}: {
  initialContent?: object | null;
  onChange: (json: object) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none focus:outline-none min-h-[300px] p-4 bg-background border border-border rounded-md",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL на връзката", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Грешка при качване");
        return;
      }
      editor?.chain().focus().setImage({ src: data.url }).run();
    } finally {
      setUploading(false);
    }
  }

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-1 border border-border rounded-md bg-secondary/40">
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          ariaLabel="Получер"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          ariaLabel="Курсив"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          ariaLabel="Заглавие 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          ariaLabel="Заглавие 3"
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          ariaLabel="Списък"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          ariaLabel="Номериран списък"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={handleSetLink}
          isActive={editor.isActive("link")}
          ariaLabel="Връзка"
        >
          Връзка
        </ToolbarButton>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn("h-7", TOOLBAR_BTN)}
        >
          {uploading ? "Качва се…" : "Изображение"}
        </Button>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().undo().run()}
          ariaLabel="Назад"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().redo().run()}
          ariaLabel="Напред"
        >
          ↷
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImageUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
