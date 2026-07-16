import { useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, Code2, Image } from 'lucide-react'

interface EmailEditorProps {
  onChange: (html: string) => void
  initialContent?: string
}

export function EmailEditor({ onChange, initialContent = '' }: EmailEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [rawHtml, setRawHtml] = useState(initialContent)
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do seu e-mail aqui...' }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setRawHtml(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'min-h-[280px] p-4 text-sm text-zinc-900 focus:outline-none prose prose-sm max-w-none',
      },
    },
  })

  const switchToHtml = () => {
    if (editor) setRawHtml(editor.getHTML())
    setMode('html')
  }

  const switchToVisual = () => {
    if (editor) {
      editor.commands.setContent(rawHtml)
      onChange(rawHtml)
    }
    setMode('visual')
  }

  const handleRawChange = (value: string) => {
    setRawHtml(value)
    onChange(value)
  }

  const insertImage = () => {
    const url = imageUrl.trim()
    if (!url) return
    if (mode === 'html') {
      const tag = `\n<img src="${url}" alt="" style="max-width:100%;height:auto;" />\n`
      const newHtml = rawHtml + tag
      setRawHtml(newHtml)
      onChange(newHtml)
    } else if (editor) {
      const current = editor.getHTML()
      const tag = `<img src="${url}" alt="" style="max-width:100%;height:auto;" />`
      const newHtml = current + tag
      editor.commands.setContent(newHtml)
      onChange(newHtml)
    }
    setImageUrl('')
    setShowImageInput(false)
  }

  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'}`

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-100 bg-zinc-50 flex-wrap">
        {mode === 'visual' && editor && (
          <>
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
            <div className="w-px h-4 bg-zinc-200 mx-1" />
          </>
        )}

        {/* Image insert */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowImageInput(v => !v); setImageUrl('') }}
            className={btn(showImageInput)}
            title="Inserir imagem"
          >
            <Image size={13} />
          </button>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-zinc-200 rounded-lg shadow-lg p-3 flex gap-2 w-72">
              <input
                ref={imageInputRef}
                autoFocus
                type="url"
                placeholder="URL da imagem (https://...)"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') insertImage() }}
                className="flex-1 h-8 rounded-md border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={insertImage}
                className="h-8 px-3 bg-zinc-900 text-white text-xs rounded-md hover:bg-zinc-700"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="ml-auto flex gap-1 bg-zinc-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={switchToVisual}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'visual' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={switchToHtml}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'html' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            <Code2 size={11} /> HTML
          </button>
        </div>
      </div>

      {/* Editor area */}
      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={rawHtml}
          onChange={e => handleRawChange(e.target.value)}
          className="w-full min-h-[280px] p-4 text-xs text-zinc-900 font-mono bg-zinc-950 text-green-400 focus:outline-none resize-y"
          placeholder="<p>Escreva o HTML do e-mail aqui...</p>"
          spellCheck={false}
        />
      )}
    </div>
  )
}
