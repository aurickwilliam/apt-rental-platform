import { useCallback, useState } from 'react'
import { View, LayoutChangeEvent } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface ZigzagEdgeProps {
  /** Color painted into the notches — MUST match whatever renders behind the card
   *  (e.g. the modal/sheet background), or the illusion breaks. */
  cutColor: string
  /** How deep each notch cuts into the card, in px */
  depth?: number
  /** Target width of each tooth, in px (auto-adjusted to fit evenly) */
  toothWidth?: number
}

export default function ZigzagEdge({
  cutColor,
  depth = 10,
  toothWidth = 18,
}: ZigzagEdgeProps) {
  const [width, setWidth] = useState(0)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width))
  }, [])

  if (width === 0) {
    return <View onLayout={onLayout} style={{ height: depth }} />
  }

  // Recompute tooth width so teeth fit evenly with no partial tooth at the edges
  const teeth = Math.max(1, Math.round(width / toothWidth))
  const tooth = width / teeth

  let d = `M0,${depth} `
  for (let i = 0; i < teeth; i++) {
    const peakX = i * tooth + tooth / 2
    const troughX = (i + 1) * tooth
    d += `L${peakX},0 L${troughX},${depth} `
  }
  d += 'Z'

  return (
    <View
      onLayout={onLayout}
      pointerEvents='none'
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: depth,
      }}
    >
      <Svg width={width} height={depth} viewBox={`0 0 ${width} ${depth}`}>
        <Path d={d} fill={cutColor} />
      </Svg>
    </View>
  )
}
