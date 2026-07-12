"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Note } from "@/hooks/useNotes";
import {
  Bold, Italic, Strikethrough,
  Heading1, Heading2, Type,
  List, ListOrdered, ListChecks,
  Quote, Minus, Code2,
  Link2, ImageIcon, Smile,
  Pin, Tag, X, Check,
  ChevronRight,
} from "lucide-react";

export const NOTE_COLORS: { value: string; bg: string; border: string; swatch: string }[] = [
  { value: "default", bg: "bg-card",                              border: "border-border",                        swatch: "bg-card border border-border"            },
  { value: "yellow",  bg: "bg-yellow-50 dark:bg-yellow-950/40",  border: "border-yellow-200 dark:border-yellow-800", swatch: "bg-yellow-200 dark:bg-yellow-700"     },
  { value: "green",   bg: "bg-green-50 dark:bg-green-950/40",    border: "border-green-200 dark:border-green-800",   swatch: "bg-green-200 dark:bg-green-700"       },
  { value: "blue",    bg: "bg-blue-50 dark:bg-blue-950/40",      border: "border-blue-200 dark:border-blue-800",     swatch: "bg-blue-200 dark:bg-blue-700"         },
  { value: "pink",    bg: "bg-pink-50 dark:bg-pink-950/40",      border: "border-pink-200 dark:border-pink-800",     swatch: "bg-pink-200 dark:bg-pink-700"         },
  { value: "purple",  bg: "bg-purple-50 dark:bg-purple-950/40",  border: "border-purple-200 dark:border-purple-800", swatch: "bg-purple-200 dark:bg-purple-700"     },
  { value: "gray",    bg: "bg-gray-50 dark:bg-gray-900/60",      border: "border-gray-200 dark:border-gray-700",     swatch: "bg-gray-300 dark:bg-gray-600"         },
];

const EMOJI_LIST = [
  "😀","😂","😍","🥹","😎","🤔","😴","🥳",
  "👍","👏","🙌","💪","✌️","🤝","🫶","💯",
  "🔥","⭐","✅","❌","⚠️","💡","📌","🎯",
  "🚀","⏰","📅","💰","📊","🏆","🎉","❤️",
];

function DraggableTaskItemView({ node, updateAttributes }: { node: { attrs: { checked: boolean } }; updateAttributes: (attrs: Record<string, unknown>) => void }) {
  const checked = node.attrs.checked;
  const wrapperRef = useRef<HTMLLIElement>(null);

  function onDragStart(e: React.DragEvent) {
    const li = wrapperRef.current;
    if (!li) return;
    li.classList.add("is-dragging");

    const text = (li.querySelector("[data-node-view-content]") as HTMLElement | null)?.textContent ?? "";
    const isDark = document.documentElement.classList.contains("dark");

    // Build a completely self-contained ghost — no cloning, so CSS context never matters
    const ghost = document.createElement("div");
    ghost.style.cssText =
      `position:fixed;top:-9999px;left:-9999px;` +
      `width:${li.offsetWidth}px;height:34px;` +
      `display:flex;align-items:center;gap:8px;flex-wrap:nowrap;` +
      `background:${isDark ? "#2d2538" : "#ffffff"};` +
      `border:1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"};` +
      `border-radius:8px;` +
      `box-shadow:0 6px 22px rgba(0,0,0,0.13),0 2px 6px rgba(0,0,0,0.07);` +
      `padding:0 10px;font-family:inherit;font-size:13.5px;` +
      `color:${isDark ? "#ede9f5" : "#27202e"};pointer-events:none;`;

    const cbLabel = document.createElement("label");
    cbLabel.style.cssText = "display:inline-flex;align-items:center;flex-shrink:0;";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    cb.style.cssText = "width:13px;height:13px;accent-color:#e06090;pointer-events:none;";
    cbLabel.appendChild(cb);
    ghost.appendChild(cbLabel);

    const span = document.createElement("span");
    span.textContent = text;
    span.style.cssText =
      `overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1;` +
      (checked ? "text-decoration:line-through;opacity:0.5;" : "");
    ghost.appendChild(span);

    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, Math.min(e.nativeEvent.offsetX, li.offsetWidth / 2), 17);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function onDragEnd() {
    wrapperRef.current?.classList.remove("is-dragging");
  }

  return (
    <NodeViewWrapper
      as="li"
      ref={wrapperRef}
      data-type="taskItem"
      data-checked={String(checked)}
      style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "nowrap" }}
    >
      <span
        contentEditable={false}
        draggable
        data-drag-handle
        className="task-drag-handle"
        style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <svg viewBox="0 0 10 16" width="8" height="12" fill="currentColor">
          <circle cx="2.5" cy="2.5"  r="1.5" />
          <circle cx="7.5" cy="2.5"  r="1.5" />
          <circle cx="2.5" cy="8"    r="1.5" />
          <circle cx="7.5" cy="8"    r="1.5" />
          <circle cx="2.5" cy="13.5" r="1.5" />
          <circle cx="7.5" cy="13.5" r="1.5" />
        </svg>
      </span>
      <label contentEditable={false} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={() => updateAttributes({ checked: !checked })} />
      </label>
      <NodeViewContent as="div" style={{ flex: 1, minWidth: 0, display: "inline" }} />
    </NodeViewWrapper>
  );
}

// Manages the sliding-gap animation during checklist drag (Google Keep style)
function useChecklistDragGap(editor: ReturnType<typeof useEditor>) {
  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom as HTMLElement;
    let lastOver: Element | null = null;

    function getItem(el: EventTarget | null): Element | null {
      let node = el as Element | null;
      while (node && node !== root) {
        if ((node as HTMLElement).dataset?.type === "taskItem") return node;
        node = node.parentElement;
      }
      return null;
    }

    function clearGap(el: Element | null) {
      el?.classList.remove("drag-gap-above", "drag-gap-below");
    }

    function onDragOver(e: DragEvent) {
      const item = getItem(e.target);
      if (!item || item.classList.contains("is-dragging")) {
        clearGap(lastOver);
        lastOver = null;
        return;
      }
      if (item !== lastOver) {
        clearGap(lastOver);
        lastOver = item;
      }
      const mid = item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2;
      item.classList.toggle("drag-gap-above", e.clientY < mid);
      item.classList.toggle("drag-gap-below", e.clientY >= mid);
    }

    function onDragEnd() {
      clearGap(lastOver);
      lastOver = null;
    }

    root.addEventListener("dragover", onDragOver);
    root.addEventListener("dragend", onDragEnd);
    root.addEventListener("drop", onDragEnd);
    return () => {
      root.removeEventListener("dragover", onDragOver);
      root.removeEventListener("dragend", onDragEnd);
      root.removeEventListener("drop", onDragEnd);
    };
  }, [editor]);
}

interface Props {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Omit<Note, "id" | "createdAt">>) => void;
  onCreate: (partial: Omit<Note, "id" | "createdAt">) => void;
}

export default function NoteEditorDialog({ note, open, onClose, onSave, onCreate }: Props) {
  const [title, setTitle]     = useState("");
  const [color, setColor]     = useState("default");
  const [pinned, setPinned]   = useState(false);
  const [labels, setLabels]   = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [showColors, setShowColors] = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const imageRef = useRef<HTMLInputElement>(null);
  const isNew    = note === null;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "" } } }),
      TaskList,
      TaskItem.extend({
        draggable: true,
        addNodeView() { return ReactNodeViewRenderer(DraggableTaskItemView as never); },
      }).configure({ nested: true }),
      Link.configure({ openOnClick: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      Placeholder.configure({ placeholder: "Take a note…" }),
    ],
    editorProps: {
      attributes: { class: "tiptap-content focus:outline-none" },
    },
    content: "",
  });

  useChecklistDragGap(editor);

  // Sync state when note changes or dialog opens
  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setColor(note?.color ?? "default");
    setPinned(note?.pinned ?? false);
    setLabels(note?.labels ?? []);
    setLabelInput("");
    setShowColors(false);
    setShowEmoji(false);
    setShowLabels(false);
    setShowLinkInput(false);
    if (editor) {
      editor.commands.setContent(note?.content ?? "");
    }
  }, [open, note, editor]);

  function handleClose() {
    if (!editor) { onClose(); return; }
    const content = editor.getHTML();
    const isEmpty  = editor.isEmpty && title.trim() === "";
    if (isNew && !isEmpty) {
      onCreate({ title: title.trim(), content, color, pinned, labels });
    } else if (!isNew && note) {
      onSave(note.id, { title: title.trim(), content, color, pinned, labels });
    }
    onClose();
  }

  function insertLink() {
    if (!editor || !linkUrl.trim()) return;
    const url = linkUrl.trim();
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function insertImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }

  function addLabel() {
    const t = labelInput.trim();
    if (t && !labels.includes(t)) setLabels([...labels, t]);
    setLabelInput("");
  }

  const { bg, border } = NOTE_COLORS.find((c) => c.value === color) ?? NOTE_COLORS[0];

  if (!editor) return null;

  // Toolbar button helper
  const TB = ({
    onClick, active = false, title: tip, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={tip}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border p-0",
          bg, border
        )}
      >
        {/* Title */}
        <div className="px-5 pt-5">
          <input
            className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Formatting toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-2">
          {/* Text type group */}
          <TB onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">
            <Type className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="size-3.5" />
          </TB>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Inline formatting */}
          <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="size-3.5" />
          </TB>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Lists */}
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="To-do list">
            <ListChecks className="size-3.5" />
          </TB>

          {/* Toggle / collapsible */}
          <TB
            onClick={() => {
              const html = `<details><summary>Toggle</summary><p></p></details>`;
              editor.chain().focus().insertContent(html).run();
            }}
            title="Toggle list"
          >
            <ChevronRight className="size-3.5" />
          </TB>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Block types */}
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
            <Quote className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="size-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
            <Code2 className="size-3.5" />
          </TB>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Link */}
          <div className="relative">
            <TB onClick={() => { setShowLinkInput((v) => !v); setShowEmoji(false); }} active={editor.isActive("link")} title="Insert link">
              <Link2 className="size-3.5" />
            </TB>
            {showLinkInput && (
              <div className="absolute top-8 left-0 z-20 flex items-center gap-1.5 rounded-xl border bg-card p-2 shadow-lg">
                <input
                  autoFocus
                  className="w-44 rounded-lg border bg-background px-2 py-1 text-xs outline-none"
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") insertLink(); if (e.key === "Escape") setShowLinkInput(false); }}
                />
                <button onMouseDown={(e) => { e.preventDefault(); insertLink(); }} className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Image */}
          <TB onClick={() => imageRef.current?.click()} title="Insert image">
            <ImageIcon className="size-3.5" />
          </TB>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ""; }} />

          {/* Emoji */}
          <div className="relative">
            <TB onClick={() => { setShowEmoji((v) => !v); setShowLinkInput(false); }} title="Insert emoji">
              <Smile className="size-3.5" />
            </TB>
            {showEmoji && (
              <div className="absolute top-8 left-0 z-20 w-56 rounded-xl border bg-card p-2 shadow-lg">
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJI_LIST.map((e) => (
                    <button
                      key={e}
                      onMouseDown={(ev) => { ev.preventDefault(); editor.chain().focus().insertContent(e).run(); setShowEmoji(false); }}
                      className="flex size-6 items-center justify-center rounded text-base hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <EditorContent editor={editor} />
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t px-5 py-2">
            {labels.map((l) => (
              <span key={l} className="flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-xs font-medium">
                {l}
                <button onClick={() => setLabels(labels.filter((x) => x !== l))} className="text-muted-foreground hover:text-foreground">
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="flex items-center gap-1">
            {/* Background color */}
            <div className="relative">
              <button
                onClick={() => { setShowColors((v) => !v); setShowEmoji(false); setShowLinkInput(false); setShowLabels(false); }}
                title="Background color"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <ColorWheelIcon />
              </button>
              {showColors && (
                <div className="absolute bottom-9 left-0 z-20 flex gap-1.5 rounded-xl border bg-card p-2 shadow-lg">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.value}
                      onClick={() => { setColor(c.value); setShowColors(false); }}
                      className={cn("size-6 rounded-full border-2 transition-transform hover:scale-110", c.swatch, color === c.value ? "border-foreground" : "border-transparent")}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Labels */}
            <div className="relative">
              <button
                onClick={() => { setShowLabels((v) => !v); setShowColors(false); setShowEmoji(false); setShowLinkInput(false); }}
                title="Add label"
                className={cn("flex size-7 items-center justify-center rounded-full transition-colors", labels.length > 0 ? "text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                <Tag className="size-3.5" />
              </button>
              {showLabels && (
                <div className="absolute bottom-9 left-0 z-20 w-48 rounded-xl border bg-card p-2 shadow-lg">
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      className="flex-1 rounded-lg border bg-background px-2 py-1 text-xs outline-none"
                      placeholder="Label name…"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { addLabel(); } if (e.key === "Escape") setShowLabels(false); }}
                    />
                    <button onClick={addLabel} className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pin */}
            <button
              onClick={() => setPinned((v) => !v)}
              title={pinned ? "Unpin" : "Pin"}
              className={cn("flex size-7 items-center justify-center rounded-full transition-colors", pinned ? "text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              <Pin className="size-3.5" />
            </button>
          </div>

          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ColorWheelIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 7A5.5 5.5 0 0 1 7 12.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12.5A5.5 5.5 0 0 1 1.5 7" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1.5 7A5.5 5.5 0 0 1 7 1.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
