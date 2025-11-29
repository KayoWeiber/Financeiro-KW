import React, { useEffect, useRef, useState } from 'react'

export type FancyOption = { value: string; label: string; color?: string }

interface FancySelectProps {
  value: string
  options: FancyOption[]
  placeholder?: string
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const palette = {
  border: 'rgba(0,0,0,0.12)',
  bg: 'white',
  hover: 'rgba(0,0,0,0.06)',
  primary: '#4361ee'
}

const FancySelect: React.FC<FancySelectProps> = ({ value, options, placeholder = 'Selecionar...', onChange, disabled, className = '', size = 'md' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const baseHeight = size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm'

  return (
    <div ref={ref} className={`relative select-none ${className}`}>      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full ${baseHeight} rounded-md px-3 flex items-center justify-between transition border shadow-sm bg-white`}
        style={{
          background: open ? 'linear-gradient(135deg,#f5f7fa,#e4ebf3)' : palette.bg,
          borderColor: open ? palette.primary : palette.border,
          color: '#222'
        }}
      >
        <span className="truncate flex items-center gap-2">
          {selected ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-black/10"
                style={{ background: selected.color || palette.primary }}
              />
              {selected.label}
            </span>
          ) : (
            <span className="opacity-50">{placeholder}</span>
          )}
        </span>
        <span className={`transition text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div
          className="absolute left-0 mt-1 w-full rounded-lg shadow-lg border overflow-hidden z-50 bg-white"
          style={{ background: 'linear-gradient(135deg,#f6f9fc,#e9eef5)', borderColor: palette.border }}
        >
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition text-xs`}
                  style={{ background: opt.value === value ? 'rgba(67,97,238,0.08)' : 'transparent', color:'#222' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-black/10" style={{ background: opt.color || palette.primary }} />
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-2 text-xs opacity-60">Sem opções</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FancySelect
