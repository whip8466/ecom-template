'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import { useEffect } from 'react';
import { normalizeBodyForEditor } from '@/lib/blog-body-html';

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium ${
        active ? 'bg-[#e8efff] text-[#246bfd]' : 'text-[#475467] hover:bg-[#f2f4f7]'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function SitePageToolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  useEditorState({
    editor,
    selector: (s) => s.transactionNumber,
  });

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = typeof window !== 'undefined' ? window.prompt('Link URL', prev || 'https://') : null;
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#e5ebf5] bg-[#f8fafc] px-2 py-1.5">
      <ToolbarButton
        title="Bold"
        disabled={disabled}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        disabled={disabled}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e5ebf5]" aria-hidden />
      <ToolbarButton
        title="Heading 2"
        disabled={disabled}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        disabled={disabled}
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e5ebf5]" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        disabled={disabled}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        disabled={disabled}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        disabled={disabled}
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “ ”
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e5ebf5]" aria-hidden />
      <ToolbarButton
        title="Link"
        disabled={disabled}
        active={editor.isActive('link')}
        onClick={setLink}
      >
        Link
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e5ebf5]" aria-hidden />
      <ToolbarButton
        title="Undo"
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        Redo
      </ToolbarButton>
    </div>
  );
}

export function SitePageBodyEditor({
  initialHtml,
  onChange,
  disabled,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-[#246bfd] underline underline-offset-2',
        },
      }),
    ],
    content: normalizeBodyForEditor(initialHtml),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'blog-html-content min-h-[280px] max-w-none px-3 py-2 text-sm leading-relaxed text-[#1c2740] outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="rounded-admin border border-[#e5ebf5] bg-white px-3 py-10 text-center text-sm text-[#64748b]">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-admin border border-[#e5ebf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <SitePageToolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}
