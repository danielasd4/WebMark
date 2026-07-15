import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react'

interface EmailEditorProps {
  onChange: (html: string) => void
  initialContent?: string
}

export function EmailEditor({ onChange, initialContent = '' }: EmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do seu e-mail aqui...' }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[280px] p-4 text-sm text-zinc-900 focus:outline-none prose prose-sm max-w-none',
      },
    },
  })

  if (!editor) return null

  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'}`

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-100 bg-zinc-50 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
          <Bold size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
          <Italic size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>
          <Heading2 size={13} />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>
          <List size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>
          <ListOrdered size={13} />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false) + ' disabled:opacity-30'}>
          <Undo size={13} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false) + ' disabled:opacity-30'}>
          <Redo size={13} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
