import React, { useState, useRef, useEffect } from 'react'
import { Mail, X, AlertCircle } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * MultiEmailInput
 * Supports typing emails and pressing Comma (,), Enter, or Tab to create tags/chips.
 * Handles pasting comma-separated or multi-line emails.
 * Value is managed as a comma-separated string (e.g. "a@b.com, c@d.com") for 100% schema compatibility.
 */
export default function MultiEmailInput({
  value = '',
  onChange,
  onBlur,
  placeholder = 'e.g. contact@business.com',
  error,
  disabled = false,
  id,
  className = '',
}) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Parse comma-separated string into an array of clean email strings
  const emails = React.useMemo(() => {
    if (!value || typeof value !== 'string') return []
    return value
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
  }, [value])

  const commitEmails = (newEmailsList) => {
    // Deduplicate while preserving order, lowercase for standard email formatting
    const unique = []
    newEmailsList.forEach(e => {
      const clean = e.trim().toLowerCase()
      if (clean && !unique.includes(clean)) {
        unique.push(clean)
      }
    })
    const joined = unique.join(', ')
    if (onChange) {
      onChange(joined)
    }
  }

  const addEmailsFromString = (text) => {
    if (!text) return
    // Split by comma, semicolon, space, or newline
    const parsed = text
      .split(/[,;\n\r\t]+/)
      .map(e => e.trim())
      .filter(Boolean)

    if (parsed.length > 0) {
      commitEmails([...emails, ...parsed])
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    // Comma, Enter, or Tab to add current input
    if (e.key === ',' || e.key === 'Enter' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault()
        addEmailsFromString(inputValue)
        setInputValue('')
      } else if (e.key === 'Enter') {
        // Prevent accidental form submit if input is empty
        e.preventDefault()
      }
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      e.preventDefault()
      const updated = emails.slice(0, -1)
      commitEmails(updated)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    // If the user typed or pasted a comma or semicolon directly into input
    if (val.includes(',') || val.includes(';')) {
      addEmailsFromString(val)
      setInputValue('')
    } else {
      setInputValue(val)
    }
  }

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text')
    if (pasteData && (pasteData.includes(',') || pasteData.includes(';') || pasteData.includes('\n') || pasteData.includes(' '))) {
      e.preventDefault()
      addEmailsFromString(pasteData)
      setInputValue('')
    }
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    // If user typed something and blurred without pressing comma or Enter, commit it
    if (inputValue.trim()) {
      addEmailsFromString(inputValue)
      setInputValue('')
    }
    if (onBlur) {
      onBlur(e)
    }
  }

  const removeEmail = (indexToRemove) => {
    if (disabled) return
    const updated = emails.filter((_, idx) => idx !== indexToRemove)
    commitEmails(updated)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleContainerClick = (e) => {
    // Focus the inner input when clicking on the container
    if (e.target !== inputRef.current && inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`w-full bg-kb-white border rounded-lg px-2.5 py-1.5 min-h-[42px] flex flex-wrap items-center gap-1.5 transition-all duration-200 cursor-text ${
          error
            ? 'border-kb-crimson ring-1 ring-kb-crimson/20'
            : isFocused
            ? 'border-kb-strawberry ring-2 ring-kb-strawberry/15'
            : 'border-kb-sand hover:border-kb-taupe'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-kb-cream-deep' : ''} ${className}`}
      >
        {/* Render chips for each added email */}
        {emails.map((email, idx) => {
          const isValid = EMAIL_REGEX.test(email)
          return (
            <span
              key={`${email}-${idx}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                isValid
                  ? 'bg-kb-cream-deep border border-kb-sand text-kb-cocoa'
                  : 'bg-kb-crimson-bg border border-kb-crimson-border text-kb-crimson-fg'
              }`}
            >
              {isValid ? (
                <Mail className="w-3 h-3 text-kb-umber flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-kb-crimson flex-shrink-0" title="Invalid email format" />
              )}
              <span className="truncate max-w-[190px] select-all" title={email}>
                {email}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeEmail(idx)
                  }}
                  className="w-3.5 h-3.5 rounded-full hover:bg-kb-sand/60 flex items-center justify-center text-kb-taupe hover:text-kb-crimson ml-0.5 transition-colors cursor-pointer"
                  title="Remove email"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          )
        })}

        {/* Input for typing or pasting new email */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={emails.length === 0 ? placeholder : 'Add another email (comma or enter)...'}
          className="flex-1 min-w-[150px] bg-transparent border-0 outline-none p-1 text-sm text-kb-text placeholder-kb-taupe focus:ring-0 focus:outline-none"
        />
      </div>
      <p className="text-[11px] text-kb-muted mt-1">
        Type an email and press <kbd className="px-1 py-0.5 bg-kb-cream-deep rounded border border-kb-sand font-mono text-[10px]">,</kbd> or <kbd className="px-1 py-0.5 bg-kb-cream-deep rounded border border-kb-sand font-mono text-[10px]">Enter</kbd> to add multiple emails.
      </p>
    </div>
  )
}
