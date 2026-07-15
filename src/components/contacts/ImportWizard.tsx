import { useState, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle, Sparkles,
  Users, ArrowRight, X, RefreshCw
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface ImportWizardProps {
  open: boolean
  onClose: () => void
}

type Step = 'upload' | 'analyzing' | 'preview' | 'done'

const mockPreview = [
  { first_name: 'Marina', last_name: 'Souza', email: 'marina@exemplo.com', phone: '(11) 99999-1234', company: 'StartupX', job_title: 'CEO', status: 'new' as const },
  { first_name: 'Carlos', last_name: 'Alves', email: 'carlos@negocio.com', phone: '(21) 98888-5678', company: 'Negócio & Cia', job_title: 'Diretor', status: 'new' as const },
  { first_name: 'Juliana', last_name: 'Lima', email: 'ju@moda.com.br', company: 'Moda Fashion', job_title: 'Fundadora', status: 'duplicate' as const },
]

export function ImportWizard({ open, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    setStep('analyzing')
    setTimeout(() => setStep('preview'), 2500)
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
  }

  const handleClose = () => {
    setStep('upload')
    setFileName('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar contatos" size="lg">
      <div className="space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {(['upload', 'analyzing', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                step === s ? 'bg-zinc-900 text-white' :
                  (['upload', 'analyzing', 'preview', 'done'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400')
              )}>
                {['upload', 'analyzing', 'preview', 'done'].indexOf(step) > i ? (
                  <CheckCircle2 size={12} />
                ) : i + 1}
              </div>
              {i < 3 && <div className={cn('flex-1 h-px', ['upload', 'analyzing', 'preview', 'done'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-zinc-100')} />}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
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
              <input id="import-file" type="file" accept=".csv,.xlsx,.xls,.pdf,.docx,.txt,.png,.jpg" className="hidden" onChange={handleInput} />
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload size={20} className="text-zinc-500" />
              </div>
              <p className="font-medium text-zinc-900 mb-1">Arraste seu arquivo aqui</p>
              <p className="text-sm text-zinc-400 mb-3">ou clique para selecionar</p>
              <p className="text-xs text-zinc-300">Suporta CSV, Excel, PDF, DOCX, TXT, Imagem</p>
            </div>

            <div className="bg-zinc-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">IA de importação inteligente</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Nossa IA analisa qualquer formato de arquivo, extrai nomes, e-mails, telefones, empresas e mais — mesmo de arquivos desorganizados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === 'analyzing' && (
          <div className="py-10 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <RefreshCw size={24} className="text-zinc-500 animate-spin" />
              <div className="absolute inset-0 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-zinc-900 mb-2">Analisando {fileName}...</p>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>✓ Lendo arquivo</p>
              <p>✓ Identificando campos</p>
              <p className="animate-pulse">⟳ Extraindo contatos com IA...</p>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {mockPreview.filter(c => c.status === 'new').length}
                </p>
                <p className="text-xs text-emerald-600 mt-1">Novos contatos</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {mockPreview.filter(c => c.status === 'duplicate').length}
                </p>
                <p className="text-xs text-amber-600 mt-1">Duplicados</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-700">0</p>
                <p className="text-xs text-zinc-500 mt-1">Erros</p>
              </div>
            </div>

            <p className="text-sm font-medium text-zinc-900">Prévia dos contatos detectados</p>

            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">Nome</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">E-mail</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Empresa</th>
                    <th className="text-left p-3 text-xs font-medium text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {mockPreview.map((c, i) => (
                    <tr key={i} className={cn('hover:bg-zinc-50', c.status === 'duplicate' && 'opacity-60')}>
                      <td className="p-3 font-medium text-zinc-900">{c.first_name} {c.last_name}</td>
                      <td className="p-3 text-zinc-600">{c.email}</td>
                      <td className="p-3 text-zinc-500 hidden md:table-cell">{c.company}</td>
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
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={() => setStep('done')} className="flex-1" icon={<Users size={14} />}>
                Importar {mockPreview.filter(c => c.status === 'new').length} contatos
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <p className="text-xl font-semibold text-zinc-900 mb-2">Importação concluída!</p>
            <p className="text-sm text-zinc-500 mb-8">
              {mockPreview.filter(c => c.status === 'new').length} contatos foram adicionados ao seu CRM.
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
