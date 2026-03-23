import { useState, useRef, useContext, useEffect } from 'react'
import type { Dispatch } from 'react'
import type { GameAction, GameState } from '../../game'
import { validateWord, getLastSyllable, selectBotWord } from '../../engine'
import type { BonusType } from '../../engine'
import { GameDataContext } from '../App/App'
import { BonusIndicator } from './BonusIndicator'
import { ErrorMessage } from './ErrorMessage'
import { playSuccessSound, playErrorSound } from './sounds'
import styles from './WordInput.module.css'

interface WordInputProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function WordInput({ state, dispatch }: WordInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [flashState, setFlashState] = useState<'none' | 'success' | 'error'>('none')
  const [localError, setLocalError] = useState<string | null>(null)
  const [bonusIndicator, setBonusIndicator] = useState<BonusType | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSubmittingRef = useRef(false)
  const gameData = useContext(GameDataContext)!
  const { dictionary, graph, syllables } = gameData

  // Cleanup des timers au démontage
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current)
    }
  }, [])

  // Reset du guard de soumission après chaque rendu
  useEffect(() => {
    isSubmittingRef.current = false
  })

  function flash(type: 'success' | 'error') {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setFlashState(type)
    flashTimerRef.current = setTimeout(() => {
      setFlashState('none')
      flashTimerRef.current = null
    }, 150)
  }

  function showError(message: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    setLocalError(message)
    errorTimerRef.current = setTimeout(() => setLocalError(null), 2000)
  }

  function handleSubmit() {
    if (isSubmittingRef.current) return
    const trimmed = inputValue.trim()
    if (!trimmed) return
    isSubmittingRef.current = true

    const result = validateWord(trimmed, state.currentWord, dictionary, graph, syllables, state.chain)

    if (result.valid) {
      // Happy path
      dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: true, scorePoints: result.scorePoints, bonusType: result.bonusType })
      flash('success')
      playSuccessSound()

      // Indicateur bonus (FR16, FR17)
      if (result.bonusType !== 'none') {
        if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current)
        setBonusIndicator(result.bonusType)
        bonusTimerRef.current = setTimeout(() => setBonusIndicator(null), 1500)
      }
      setLocalError(null)

      // Vérifier dead-end
      const lastSyl = getLastSyllable(trimmed, dictionary, graph)
      if (!lastSyl) {
        // Le mot du joueur n'a aucune lastSyl dans le graph → dead-end immédiat
        dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: undefined })
      } else {
        const botWord = selectBotWord(lastSyl, graph, [...state.chain, trimmed], trimmed, dictionary)
        if (!botWord) {
          dispatch({ type: 'GAME_OVER', reason: 'dead-end', deadSyllable: lastSyl })
        } else {
          dispatch({ type: 'BOT_RESPOND', word: botWord })
        }
      }

      setInputValue('')
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      // Error path
      const targetSyl = getLastSyllable(state.currentWord, dictionary, graph)
      const errorMsg = result.reason === 'not-in-dictionary'
        ? 'Mot non reconnu dans le dictionnaire'
        : result.reason === 'blacklisted'
        ? 'Mot non autorisé'
        : result.reason === 'inflection'
        ? 'Forme fléchie du mot courant non autorisée'
        : result.reason === 'already-played'
        ? 'Mot déjà joué dans cette partie'
        : `Ne commence pas par ${targetSyl ?? '?'}`

      dispatch({ type: 'SUBMIT_WORD', word: trimmed, isValid: false, error: errorMsg })
      flash('error')
      playErrorSound()
      showError(errorMsg)
      inputRef.current?.select()
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    // Effacer le message d'erreur dès la première frappe
    if (localError) {
      setLocalError(null)
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
        errorTimerRef.current = null
      }
    }
  }

  const inputClass = [
    styles.input,
    flashState === 'success' ? styles.success : '',
    flashState === 'error' ? styles.error : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <BonusIndicator bonusType={bonusIndicator} />
      <input
        ref={inputRef}
        type="text"
        className={inputClass}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Tape ton mot"
        aria-describedby="word-input-error"
        data-flash={flashState}
      />
      <ErrorMessage
        id="word-input-error"
        message={localError}
      />
    </div>
  )
}
