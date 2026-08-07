import { useState } from 'react'
import { X, Bug, Lightbulb, Wrench, HelpCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../shared/lib/supabase'
import useAuthStore from '../../stores/authStore'
import './BugReport.css'

const CATEGORIES = [
  { value: 'bug', label: 'Bug', icon: Bug, description: 'Algo quebrou ou não funciona' },
  { value: 'feature', label: 'Sugestão', icon: Lightbulb, description: 'Nova funcionalidade ou ideia' },
  { value: 'improvement', label: 'Melhoria', icon: Wrench, description: 'Algo que pode melhorar' },
  { value: 'other', label: 'Outro', icon: HelpCircle, description: 'Qualquer outro assunto' },
]

export default function BugReportModal({ onClose }) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const user = useAuthStore((s) => s.user)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!category || !description.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('bug_reports').insert({
        user_id: user?.id,
        category,
        description: description.trim(),
      })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar report')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bug-report-overlay" onClick={onClose}>
        <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bug-report-success">
            <div className="bug-report-success-icon">✓</div>
            <h3>Obrigado!</h3>
            <p>Seu report foi enviado com sucesso. Vamos analisar o mais rápido possível.</p>
            <button className="bug-report-btn bug-report-btn--primary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bug-report-overlay" onClick={onClose}>
      <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bug-report-header">
          <h3>Reportar Problema</h3>
          <button className="bug-report-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bug-report-form">
          <div className="bug-report-section">
            <label className="bug-report-label">Categoria</label>
            <div className="bug-report-categories">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`bug-report-category ${category === cat.value ? 'bug-report-category--active' : ''}`}
                    onClick={() => setCategory(cat.value)}
                  >
                    <Icon size={18} />
                    <span className="bug-report-category-label">{cat.label}</span>
                    <span className="bug-report-category-desc">{cat.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bug-report-section">
            <label className="bug-report-label" htmlFor="bug-description">Descrição</label>
            <textarea
              id="bug-description"
              className="bug-report-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema ou sugestão em detalhes..."
              rows={5}
              maxLength={2000}
            />
            <span className="bug-report-charcount">{description.length}/2000</span>
          </div>

          {error && <p className="bug-report-error">{error}</p>}

          <div className="bug-report-actions">
            <button type="button" className="bug-report-btn bug-report-btn--cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="bug-report-btn bug-report-btn--primary"
              disabled={!category || !description.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
