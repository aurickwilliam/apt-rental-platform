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

  let d: string
  if (hanging) {
    d = 'M0,0 '
    for (let i = 0; i < teeth; i++) {
      d += `L${i * tooth + tooth / 2},${depth} L${(i + 1) * tooth},0 `
    }
    d += 'Z'
  } else {
    // The card's own teeth point down at the middle of each segment, so its two ends are
    // valleys: the notch there is half a triangle against the page background and reads as
    // a clean edge, not as a half tooth stuck to the corner.
    d = `M0,${depth} L0,0 `
    for (let i = 0; i < teeth; i++) {
      d += `L${i * tooth + tooth / 2},${depth} L${(i + 1) * tooth},0 `
    }
    d += `L${width},${depth} Z`
  }

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
