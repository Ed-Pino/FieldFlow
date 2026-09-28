import { useRef, useState } from 'react'

const MAX_DIM = 1280
const CALIDAD = 0.75
const MAX_BYTES = 400 * 1024

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', CALIDAD))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function esDataUrl(f) {
  return typeof f === 'string' && f.startsWith('data:')
}

export default function FotoUpload({ fotos, onChange, onError }) {
  const fileRef = useRef(null)
  const [procesando, setProcesando] = useState(false)
  const [url, setUrl] = useState('')

  async function handleFiles(e) {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (files.length === 0) return
    setProcesando(true)
    try {
      const nuevas = []
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue
        const dataUrl = await fileToDataUrl(f)
        if (dataUrl.length > MAX_BYTES) {
          throw new Error(`La foto ${f.name} sigue muy pesada aun comprimida`)
        }
        nuevas.push(dataUrl)
      }
      if (nuevas.length > 0) onChange([...(fotos || []), ...nuevas])
    } catch (err) {
      if (onError) onError(err.message || 'No se pudo procesar la foto')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {(fotos || []).map((f, i) => (
          <span key={i} className="foto-thumb">
            {esDataUrl(f) ? (
              <a href={f} target="_blank" rel="noreferrer">
                <img src={f} alt={`evidencia ${i + 1}`} />
              </a>
            ) : (
              <a href={f} target="_blank" rel="noreferrer" className="foto-link">foto {i + 1}</a>
            )}
            <button
              type="button"
              className="foto-del"
              onClick={() => onChange((fotos || []).filter((_, j) => j !== i))}
              title="Quitar"
            >
              ✕
            </button>
          </span>
        ))}
        {(fotos || []).length === 0 && <span className="muted">Sin fotos.</span>}
      </div>
      <button
        type="button"
        className="btn btn-outline"
        disabled={procesando}
        onClick={() => fileRef.current && fileRef.current.click()}
      >
        {procesando ? 'Procesando…' : '📷 Tomar / subir foto'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…o pega URL https://"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            const u = url.trim()
            if (!u) return
            onChange([...(fotos || []), u])
            setUrl('')
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  )
}
