import { useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Button } from "heroui-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IconMinus, type Icon } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";
import QuickActionContent from "../QuickActionContent";
import { placeQuickAction, type QuickActionSlot, type TenantQuickActionId } from "@/service/tenancy/quickActionsPreference";

export interface SlotAction {
  id: TenantQuickActionId;
  label: string;
  description: string;
  icon: Icon;
  available: boolean;
}

interface DragItemProps {
  children: ReactNode;
  enabled: boolean;
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onFinish: () => void;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
}

function DragItem({ children, enabled, onStart, onMove, onDrop, onFinish, positionX, positionY, offsetX, offsetY }: DragItemProps) {
  const gesture = Gesture.Pan().enabled(enabled).activateAfterLongPress(300)
    .onStart((event) => runOnJS(onStart)(event.absoluteX - 24, event.absoluteY - 24))
    .onUpdate((event) => {
      positionX.set(event.absoluteX - offsetX.get() - 24);
      positionY.set(event.absoluteY - offsetY.get() - 24);
      runOnJS(onMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => runOnJS(onDrop)(event.absoluteX, event.absoluteY))
    .onFinalize(() => runOnJS(onFinish)());
  return <GestureDetector gesture={gesture}><View collapsable={false}>{children}</View></GestureDetector>;
}

interface QuickActionSlotsEditorProps {
  slots: QuickActionSlot[];
  actions: SlotAction[];
  onChange: (slots: QuickActionSlot[]) => void;
}

interface Bounds { x: number; y: number; width: number; height: number }

const MAX_SHEET_HEIGHT_RATIO = 0.85;
const PINNED_CONTENT_HEIGHT = 360;
const MIN_GRID_VIEWPORT_HEIGHT = 100;

export default function QuickActionSlotsEditor({ slots, actions, onChange }: QuickActionSlotsEditorProps) {
  const { colors } = useColors();
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const [gridHeight, setGridHeight] = useState(0);
  // Reserve space for the pinned sheet header, slots, help text and footer.
  const maxGridHeight = Math.max(MIN_GRID_VIEWPORT_HEIGHT, windowHeight * MAX_SHEET_HEIGHT_RATIO - PINNED_CONTENT_HEIGHT * fontScale);
  const [picked, setPicked] = useState<TenantQuickActionId | null>(null);
  const [dragged, setDragged] = useState<TenantQuickActionId | null>(null);
  const [hovered, setHovered] = useState(-1);
  const slotRefs = useRef<(View | null)[]>([]);
  const bounds = useRef<Bounds[]>([]);
  const container = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const sourcePosition = useRef({ x: 0, y: 0 });
  const scroll = useRef<ScrollView>(null);
  const viewport = useRef<View>(null);
  const scrollBounds = useRef<Bounds | null>(null);
  const scrollOffset = useRef(0);
  const lastScroll = useRef(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const previewStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: x.value }, { translateY: y.value }] }));

  const feedback = () => { void Haptics.selectionAsync().catch(() => { /* Haptics are optional on unsupported devices. */ }); };
  const targetAt = (px: number, py: number) => bounds.current.findIndex((rect) => rect && px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height);
  const validTarget = (id: TenantQuickActionId, target: number) => target >= 0 && (slots.includes(id) || slots[target] === null);
  const place = (id: TenantQuickActionId, target: number) => {
    if (!validTarget(id, target)) return;
    onChange(placeQuickAction(slots, id, target));
    setPicked(null);
    feedback();
    AccessibilityInfo.announceForAccessibility(`${actions.find((action) => action.id === id)?.label} placed in slot ${target + 1}`);
  };
  const start = (id: TenantQuickActionId, px: number, py: number) => {
    sourcePosition.current = { x: px, y: py };
    setDragged(id);
    setPicked(null);
    feedback();
    container.current?.measureInWindow((left, top) => {
      origin.current = { x: left, y: top };
      offsetX.set(left);
      offsetY.set(top);
    });
    slotRefs.current.forEach((ref, index) => ref?.measureInWindow((px, py, width, height) => { bounds.current[index] = { x: px, y: py, width, height }; }));
    viewport.current?.measureInWindow((px, py, width, height) => { scrollBounds.current = { x: px, y: py, width, height }; });
  };
  const move = (id: TenantQuickActionId, px: number, py: number) => {
    opacity.set(1);
    const target = targetAt(px, py);
    setHovered(validTarget(id, target) ? target : -1);
    const rect = scrollBounds.current;
    lastScroll.current += 1;
    if (rect && lastScroll.current % 4 === 0) {
      const delta = py < rect.y + 40 ? -16 : py > rect.y + rect.height - 40 ? 16 : 0;
      if (delta) {
        scroll.current?.scrollTo({ y: Math.max(0, scrollOffset.current + delta), animated: false });
      }
    }
  };
  const drop = (id: TenantQuickActionId, px: number, py: number) => {
    const target = targetAt(px, py);
    if (validTarget(id, target)) place(id, target);
    else {
      const source = sourcePosition.current;
      x.set(withSpring(source.x - origin.current.x));
      y.set(withSpring(source.y - origin.current.y));
    }
    opacity.set(withSpring(0));
  };
  const finish = () => { setHovered(-1); opacity.set(withSpring(0)); };
  const wrap = (action: SlotAction, children: ReactNode) => (
    <DragItem enabled={action.available && (slots.includes(action.id) || slots.includes(null))} positionX={x} positionY={y} offsetX={offsetX} offsetY={offsetY} onStart={(px, py) => start(action.id, px, py)} onMove={(px, py) => move(action.id, px, py)} onDrop={(px, py) => drop(action.id, px, py)} onFinish={finish}>{children}</DragItem>
  );
  const preview = actions.find((action) => action.id === dragged);

  return (
    <View ref={container} collapsable={false}>
      <Text className="mt-3 text-sm text-muted font-inter">Long-press to drag, or tap an action then a slot.</Text>
      <View className="flex-row py-4">
        {slots.map((id, index) => {
          const action = actions.find((item) => item.id === id);
          const content = <Button variant="ghost" className="h-auto w-full flex-col p-0 bg-transparent" accessibilityLabel={`Slot ${index + 1}: ${action?.label ?? "Empty"}`} onPress={() => picked ? place(picked, index) : action && setPicked(action.id)}>
            {action ? <QuickActionContent label={action.label} icon={action.icon} highlighted={hovered === index || picked === action.id} /> : <View className="w-full items-center gap-1.5"><View className={`size-12 rounded-xl border border-dashed ${hovered === index ? "border-accent bg-accent/10" : "border-border bg-surface-tertiary"}`} /><Text className="h-8 text-center text-xs leading-4 text-muted font-inter">Drop here</Text></View>}
          </Button>;
          return <View key={index} ref={(ref) => { slotRefs.current[index] = ref; }} collapsable={false} className="w-1/5 px-1">
            {action ? wrap(action, content) : content}
            {action && (
              <View pointerEvents="box-none" className="absolute top-0 left-0 right-0 items-center">
                <View pointerEvents="box-none" className="size-12">
                  <Button
                    isIconOnly
                    variant="danger-soft"
                    size="sm"
                    className="absolute -top-2 -left-2 size-6 min-w-0 p-0"
                    hitSlop={10}
                    accessibilityLabel={`Remove ${action.label}`}
                    onPress={() => {
                      onChange(slots.map((item, position) => position === index ? null : item));
                      setPicked(null);
                    }}
                  >
                    <IconMinus size={14} color={colors.danger} />
                  </Button>
                </View>
              </View>
            )}
          </View>;
        })}
      </View>
      <Text className="mb-2 text-base font-nunitoSemiBold text-foreground">Available actions</Text>
      {!slots.includes(null) && <Text className="mb-2 text-sm text-muted font-inter">All slots are full. Remove an action to add another.</Text>}
      {picked && <Text accessibilityLiveRegion="polite" className="mb-2 text-sm text-accent font-inter">Tap a slot to place {actions.find((action) => action.id === picked)?.label}.</Text>}
      <View style={{ height: Math.min(gridHeight || maxGridHeight, maxGridHeight) }} ref={viewport} onLayout={() => { viewport.current?.measureInWindow((px, py, width, height) => { scrollBounds.current = { x: px, y: py, width, height }; }); }}>
        <ScrollView ref={scroll} style={{ flex: 1 }} onContentSizeChange={(_width, height) => setGridHeight(height)} onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="flex-row flex-wrap">
          {actions.filter((action) => !slots.includes(action.id)).map((action) => <View key={action.id} className="w-1/3 px-1 mb-4">{wrap(action,
            <Button variant="ghost" isDisabled={!action.available || !slots.includes(null)} className="h-auto w-full p-0 bg-transparent" onPress={() => setPicked(action.id)} accessibilityLabel={`Select ${action.label} for an empty slot`} accessibilityHint={!action.available ? action.description : "Tap an empty slot to place this action"}>
              <QuickActionContent label={action.label} icon={action.icon} highlighted={picked === action.id} />
            </Button>,
          )}</View>)}
          </View>
        </ScrollView>
      </View>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, zIndex: 100 }, previewStyle]} className="size-12 rounded-xl bg-accent items-center justify-center">
        {preview && <preview.icon size={24} color={colors.secondaryForeground} />}
      </Animated.View>
    </View>
  );
}
