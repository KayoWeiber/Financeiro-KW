import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

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

  const baseHeight = size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm'

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full ${baseHeight} rounded-xl px-4 flex items-center justify-between transition-all duration-200 border bg-white/50 backdrop-blur-sm
          ${open ? 'border-primary ring-2 ring-primary/10 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="truncate flex items-center gap-2 text-gray-700 font-medium">
          {selected ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm"
                style={{ background: selected.color || 'var(--primary)' }}
              />
              {selected.label}
            </span>
          ) : (
            <span className="opacity-50 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      <div className={`
        absolute left-0 mt-2 w-full rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 bg-white/95 backdrop-blur-xl origin-top transition-all duration-200 ease-out
        ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
      `}>
        <ul className="max-h-60 overflow-y-auto py-1 scrollhider">
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value} className="px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`
                    w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 rounded-lg transition-colors text-sm
                    ${isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                      style={{ background: opt.color || 'var(--primary)' }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-primary" />}
                </button>
              </li>
            )
          })}
          {options.length === 0 && (
            <li className="px-4 py-3 text-xs text-gray-400 text-center italic">Sem opções disponíveis</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default FancySelect
