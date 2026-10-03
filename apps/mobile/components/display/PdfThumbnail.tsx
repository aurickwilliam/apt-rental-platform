import { useMemo, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import type PdfComponent from "react-native-pdf";

import { IconFileText } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

type PdfComponentType = typeof PdfComponent;
let cachedPdfComponent: PdfComponentType | null | undefined;

function loadPdfComponent(): PdfComponentType | null {
  if (cachedPdfComponent !== undefined) return cachedPdfComponent;
  try {
    // Lazy require (not a top-level import): react-native-pdf pulls in
    // react-native-blob-util, which throws when its native module isn't
    // linked (Expo Go, stale dev builds). Catching here keeps the app
    // working with a file-icon fallback instead of red-screening.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-pdf") as
      | { default?: PdfComponentType }
      | PdfComponentType;
    cachedPdfComponent = (typeof mod === "function" ? mod : (mod?.default ?? null)) as
      | PdfComponentType
      | null;
    return cachedPdfComponent;
  } catch {
    cachedPdfComponent = null;
    return cachedPdfComponent;
  }
}

interface PdfThumbnailProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

/**
 * First-page PDF preview. Keep the fallback in place until the native view
 * finishes rendering; never show the PDF library's download percentage.
 */
export default function PdfThumbnail({
  uri,
  style,
  iconSize = 40,
}: PdfThumbnailProps) {
  return <PdfPage key={uri} uri={uri} style={style} iconSize={iconSize} />;
}

function PdfPage({ uri, style, iconSize = 40 }: PdfThumbnailProps) {
  const { colors } = useColors();
  const [Pdf] = useState<PdfComponentType | null>(loadPdfComponent);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const source = useMemo(() => ({ uri, cache: true }), [uri]);

  if (!Pdf || !uri || failed) {
    return (
      <View
        testID="pdf-thumbnail-placeholder"
        style={[style, { alignItems: "center", justifyContent: "center" }]}
      >
        <IconFileText size={iconSize} color={colors.gray400} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Pdf
        source={source}
        singlePage
        page={1}
        scrollEnabled={false}
        enableAnnotationRendering={false}
        enableTextSelection={false}
        fitPolicy={2}
        style={{ width: "100%", height: "100%" }}
        renderActivityIndicator={() => <View />}
        onLoadComplete={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      {!ready ? (
        <View
          testID="pdf-thumbnail-placeholder"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gray100,
          }}
        >
          <IconFileText size={iconSize} color={colors.gray400} />
        </View>
      ) : null}
    </View>
  );
}
