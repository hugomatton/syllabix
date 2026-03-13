// src/components/GameScreen/sounds.ts
// Sons Web Audio API — synthétisés, zéro fichier externe (FR24)

let _audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!_audioContext) {
      _audioContext = new AudioContext()
    }
    return _audioContext
  } catch {
    return null // Safari ou navigateur sans AudioContext
  }
}

function playTone(frequency: number, duration: number, volume: number): void {
  const ctx = getAudioContext()
  if (!ctx) return

  // iOS : AudioContext souvent suspendu jusqu'à interaction utilisateur
  void ctx.resume().then(() => {
    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // Silently ignore si AudioContext échoue
    }
  })
}

export function playSuccessSound(): void {
  playTone(523, 0.15, 0.15) // C5, 150ms, volume léger
}

export function playErrorSound(): void {
  playTone(220, 0.10, 0.10) // La2, 100ms, buzz court
}
