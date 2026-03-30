'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Emoji, gitHubEmojis, shortcodeToEmoji } from '@tiptap/extension-emoji';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { normalizeBodyForEditor } from '@/lib/blog-body-html';

/** Shortcodes / names that exist in gitHubEmojis — used for the quick picker. */
const QUICK_EMOJI_KEYS = [
  'smile',
  'heart',
  '+1',
  'fire',
  'rocket',
  'clap',
  'pray',
  'eyes',
  'sparkles',
  'tada',
  'white_check_mark',
  'x',
  'warning',
  'bulb',
  'coffee',
  'star',
] as const;

/** Toolbar buttons use mousedown preventDefault so the editor keeps selection/focus when applying marks and blocks. */
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
        active ? 'bg-[#e8efff] text-[#3874ff]' : 'text-[#475467] hover:bg-[#f2f4f7]'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function EmojiQuickPicker({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <ToolbarButton title="Insert emoji" disabled={disabled} active={open} onClick={() => setOpen((o) => !o)}>
        😀
      </ToolbarButton>
      {open && !disabled ? (
        <div
          className="absolute left-0 top-full z-[400] mt-1 flex w-[220px] flex-wrap gap-1 rounded-md border border-[#e3e6ed] bg-white p-2 shadow-lg"
          role="listbox"
        >
          {QUICK_EMOJI_KEYS.map((key) => {
            const item = shortcodeToEmoji(key, gitHubEmojis);
            const glyph = item?.emoji ?? '·';
            return (
              <button
                key={key}
                type="button"
                title={item?.name ?? key}
                className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-[#f2f4f7]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setEmoji(key).run();
                  setOpen(false);
                }}
              >
                {glyph}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function EditorToolbar({
  editor,
  disabled,
  showRichBlocks,
}: {
  editor: Editor;
  disabled?: boolean;
  /** Blog: full toolbar. Product description: hide quote, emoji, image, table. */
  showRichBlocks: boolean;
}) {
  useEditorState({
    editor,
    selector: (s) => s.transactionNumber,
  });

  const insertImage = () => {
    const url = typeof window !== 'undefined' ? window.prompt('Image URL (https://…)', '') : null;
    const trimmed = url?.trim();
    if (!trimmed) return;
    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
    } catch {
      return;
    }
    editor.chain().focus().setImage({ src: trimmed, alt: '' }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#e3e6ed] bg-[#f8fafc] px-2 py-1.5">
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
      <ToolbarButton
        title="Strikethrough"
        disabled={disabled}
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e3e6ed]" aria-hidden />
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
      <span className="mx-1 h-4 w-px bg-[#e3e6ed]" aria-hidden />
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
      {showRichBlocks ? (
        <>
          <span className="mx-1 h-4 w-px bg-[#e3e6ed]" aria-hidden />
          <ToolbarButton
            title="Blockquote"
            disabled={disabled}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            Quote
          </ToolbarButton>
          <EmojiQuickPicker editor={editor} disabled={disabled} />
          <ToolbarButton title="Insert image by URL" disabled={disabled} onClick={insertImage}>
            Image
          </ToolbarButton>
          <ToolbarButton
            title="Insert table (3×3 with header row)"
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            Table
          </ToolbarButton>
        </>
      ) : null}
      <span className="mx-1 h-4 w-px bg-[#e3e6ed]" aria-hidden />
      <ToolbarButton
        title="Code block"
        disabled={disabled}
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        Code
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[#e3e6ed]" aria-hidden />
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

export function BlogBodyEditor({
  initialBody,
  onChange,
  disabled,
  /** When false (e.g. product description), hide blockquote, emoji, image, and table toolbar controls. */
  showRichBlocks = true,
}: {
  initialBody: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  showRichBlocks?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'blog-content-image',
        },
      }),
      Emoji.configure({
        emojis: gitHubEmojis,
        enableEmoticons: true,
      }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: 'blog-content-table' },
        },
      }),
    ],
    content: normalizeBodyForEditor(initialBody),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'blog-html-content min-h-[220px] px-3 py-2 outline-none',
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
      <div className="rounded-admin border border-[#e3e6ed] bg-white px-3 py-8 text-sm text-[#64748b]">Loading editor…</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-admin border border-[#e3e6ed] bg-white">
      <EditorToolbar editor={editor} disabled={disabled} showRichBlocks={showRichBlocks} />
      <EditorContent editor={editor} />
    </div>
  );
}
