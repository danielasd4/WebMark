import { useState, useCallback } from 'react'
import {
  Upload, CheckCircle2, AlertCircle, Sparkles,
  Users, X, RefreshCw, AlertTriangle
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useCreateContact } from '../../hooks/useContacts'

interface ImportWizardProps {
  open: boolean
  onClose: () => void
}

type Step = 'upload' | 'analyzing' | 'preview' | 'done'

interface ParsedContact {
  first_name: string
  last_name?: string
  email: string
  phone?: string
  whatsapp?: string
  company?: string
  job_title?: string
  status: 'new' | 'duplicate' | 'error'
  error?: string
}

const FIELD_MAP: Record<string, keyof ParsedContact> = {
  'nome': 'first_name', 'name': 'first_name', 'first_name': 'first_name', 'primeiro nome': 'first_name', 'primeiro_nome': 'first_name',
  'sobrenome': 'last_name', 'last_name': 'last_name', 'último nome': 'last_name', 'ultimo_nome': 'last_name',
  'email': 'email', 'e-mail': 'email', 'e_mail': 'email', 'mail': 'email',
  'telefone': 'phone', 'phone': 'phone', 'tel': 'phone', 'celular': 'phone', 'fone': 'phone',
  'whatsapp': 'whatsapp', 'wpp': 'whatsapp', 'zap': 'whatsapp',
  'empresa': 'company', 'company': 'company', 'organização': 'company', 'organizacao': 'company',
  'cargo': 'job_title', 'job_title': 'job_title', 'posição': 'job_title', 'funcao': 'job_title', 'função': 'job_title',
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((ch === ',' || ch === ';') && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSVFile(text: string): ParsedContact[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0])
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/["']/g, '').trim())

  const seen = new Set<string>()
  const contacts: ParsedContact[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const raw: Record<string, string> = {}

    headers.forEach((h, idx) => {
      const field = FIELD_MAP[h]
      if (field && values[idx]) raw[field as string] = values[idx].replace(/["']/g, '').trim()
    })

    if (!raw.email) continue

    const email = raw.email.toLowerCase()

    if (seen.has(email)) {
      contacts.push({ ...raw as any, email, status: 'duplicate' })
    } else {
      seen.add(email)
      contacts.push({ ...raw as any, email, status: 'new' })
    }
  }

  return contacts
}

export function ImportWizard({ open, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const createContact = useCreateContact()

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|txt)$/i)) {
      setParseError('Por enquanto, apenas arquivos .csv e .txt são suportados.')
      return
    }

    setFileName(file.name)
    setParseError(null)
    setStep('analyzing')

    try {
      const text = await file.text()
      const contacts = parseCSVFile(text)

      if (contacts.length === 0) {
        setParseError('Nenhum contato com e-mail encontrado. Verifique se o arquivo tem uma coluna "email".')
        setStep('upload')
        return
      }

      setParsedContacts(contacts)
      setTimeout(() => setStep('preview'), 800)
    } catch {
      setParseError('Erro ao ler o arquivo. Certifique-se de que é um CSV válido.')
      setStep('upload')
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    const newContacts = parsedContacts.filter(c => c.status === 'new')
    setImporting(true)
    let count = 0

    for (const c of newContacts) {
      try {
        const { status: _s, error: _e, ...contactData } = c
        await createContact.mutateAsync(contactData as any)
        count++
      } catch {
        // skip individual errors (e.g., duplicate email in DB)
      }
    }

    setImportedCount(count)
    setImporting(false)
    setStep('done')
  }

  const handleClose = () => {
    setStep('upload')
    setFileName('')
    setParsedContacts([])
    setParseError(null)
    setImportedCount(0)
    onClose()
  }

  const newContacts = parsedContacts.filter(c => c.status === 'new')
  const duplicates = parsedContacts.filter(c => c.status === 'duplicate')

  return (
    <Modal open={open} onClose={handleClose} title="Importar contatos" size="lg">
      <div className="space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {(['upload', 'analyzing', 'preview', 'done'] as Step[]).map((s, i) => {
            const stepIdx = ['upload', 'analyzing', 'preview', 'done'].indexOf(step)
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  step === s ? 'bg-zinc-900 text-white' :
                    stepIdx > i ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'
                )}>
                  {stepIdx > i ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                {i < 3 && <div className={cn('flex-1 h-px', stepIdx > i ? 'bg-emerald-500' : 'bg-zinc-100')} />}
              </div>
            )
          })}
        </div>

        {/* Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer',
                isDragging ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              )}
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <input id="import-file" type="file" accept=".csv,.txt" className="hidden" onChange={handleInput} />
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload size={20} className="text-zinc-500" />
              </div>
              <p className="font-medium text-zinc-900 mb-1">Arraste seu arquivo CSV aqui</p>
              <p className="text-sm text-zinc-400 mb-3">ou clique para selecionar</p>
              <p className="text-xs text-zinc-300">Suporta CSV e TXT com vírgula ou ponto e vírgula</p>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            )}

            <div className="bg-zinc-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">Colunas suportadas no CSV</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    nome, sobrenome, email, telefone, whatsapp, empresa, cargo
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="py-10 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <RefreshCw size={24} className="text-zinc-500 animate-spin" />
            </div>
            <p className="font-semibold text-zinc-900 mb-2">Lendo {fileName}...</p>
            <p className="text-sm text-zinc-400 animate-pulse">Identificando contatos...</p>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{newContacts.length}</p>
                <p className="text-xs text-emerald-600 mt-1">Novos contatos</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{duplicates.length}</p>
                <p className="text-xs text-amber-600 mt-1">Duplicados (ignorados)</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-700">{parsedContacts.length}</p>
                <p className="text-xs text-zinc-500 mt-1">Total no arquivo</p>
              </div>
            </div>

            <p className="text-sm font-medium text-zinc-900">Prévia dos contatos</p>

            <div className="border border-zinc-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">Nome</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">E-mail</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Empresa</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {parsedContacts.map((c, i) => (
                    <tr key={i} className={cn('hover:bg-zinc-50', c.status === 'duplicate' && 'opacity-50')}>
                      <td className="p-3 font-medium text-zinc-900">{c.first_name} {c.last_name || ''}</td>
                      <td className="p-3 text-zinc-600">{c.email}</td>
                      <td className="p-3 text-zinc-500 hidden md:table-cell">{c.company || '—'}</td>
                      <td className="p-3">
                        {c.status === 'new' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 size={11} /> Novo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <AlertCircle size={11} /> Duplicado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1" icon={<X size={14} />}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                loading={importing}
                disabled={newContacts.length === 0}
                className="flex-1"
                icon={<Users size={14} />}
              >
                Importar {newContacts.length} contato{newContacts.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <p className="text-xl font-semibold text-zinc-900 mb-2">Importação concluída!</p>
            <p className="text-sm text-zinc-500 mb-8">
              {importedCount} contato{importedCount !== 1 ? 's' : ''} adicionado{importedCount !== 1 ? 's' : ''} ao seu CRM.
            </p>
            <Button onClick={handleClose} className="mx-auto">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
