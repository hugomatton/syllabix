import { useState, useEffect } from 'react'

export function useVisualViewport(): number {
  const [height, setHeight] = useState(
    window.visualViewport?.height ?? window.innerHeight
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setHeight(vv.height)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return height
}
