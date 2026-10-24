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
  /** Draws paper-colored teeth hanging below the card (filled with `cutColor`) instead of
   *  notches cut into it, so the edge is right over any background, even a transparent one. */
  hanging?: boolean
}

export default function ZigzagEdge({
  cutColor,
  depth = 10,
  toothWidth = 18,
  hanging = false,
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

  let d = hanging ? 'M0,0 ' : `M0,${depth} `
  for (let i = 0; i < teeth; i++) {
    const midX = i * tooth + tooth / 2
    const endX = (i + 1) * tooth
    d += hanging ? `L${midX},${depth} L${endX},0 ` : `L${midX},0 L${endX},${depth} `
  }
  d += 'Z'

  // Notches cut into the card overlay its bottom edge; hanging teeth sit in the flow
  // right below it, which is where paper-colored teeth have to be to show at all.
  const placement = hanging
    ? { height: depth }
    : { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: depth }

  return (
    <View onLayout={onLayout} pointerEvents='none' style={placement}>
      <Svg width={width} height={depth} viewBox={`0 0 ${width} ${depth}`}>
        <Path d={d} fill={cutColor} />
      </Svg>
    </View>
  )
}
