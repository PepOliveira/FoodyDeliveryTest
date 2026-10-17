import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon } from './icons'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: ReactNode
  hint?: string
}

export function InputField({ label, icon, hint, ...input }: InputFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input">
        <span className="input__icon">{icon}</span>
        <input {...input} />
      </span>
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

export function PasswordField(props: Omit<InputFieldProps, 'icon' | 'type'>) {
  const [visible, setVisible] = useState(false)
  const { label, hint, ...input } = props

  return (
    <label className="field">
      <span>{label}</span>
      <span className="input">
        <span className="input__icon">
          <LockIcon />
        </span>
        <input {...input} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          className="input__toggle"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}
