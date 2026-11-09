import { useEffect, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import PdfThumbnailGenerator from "react-native-pdf-thumbnail";

import { IconFileText } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

/** Caps the rendered page; plenty for the full-width document card. */
const THUMBNAIL_MAX_SIZE = 1200;

type ThumbnailState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; uri: string };

function removeCacheFile(file: File | null) {
  try {
    if (file?.exists) file.delete();
  } catch {
    // The cache is disposable; the OS clears whatever is left behind.
  }
}

/**
 * Downloads the PDF to the cache (the renderer only reads local files),
 * renders its first page to a JPEG and removes the downloaded copy. Returns
 * the JPEG file; the caller removes it when the thumbnail goes away.
 */
async function renderFirstPage(uri: string): Promise<File> {
  const pdf = new File(
    Paths.cache,
    `pdf-thumbnail-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
  );
  try {
    await File.downloadFileAsync(uri, pdf, { idempotent: true });
    const page = await PdfThumbnailGenerator.generate(pdf.uri, 0, {
      maxWidth: THUMBNAIL_MAX_SIZE,
      maxHeight: THUMBNAIL_MAX_SIZE,
    });
    return new File(page.uri);
  } finally {
    removeCacheFile(pdf);
  }
}

interface PdfThumbnailProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

/**
 * First-page PDF preview. The file icon stays in place until the page image is
 * ready, and replaces it if the PDF cannot be downloaded or rendered.
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
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({
    status: uri ? "loading" : "failed",
  });

  useEffect(() => {
    if (!uri) return;

    let active = true;
    let rendered: File | null = null;

    renderFirstPage(uri)
      .then((file) => {
        if (!active) {
          removeCacheFile(file);
          return;
        }
        rendered = file;
        setThumbnail({ status: "ready", uri: file.uri });
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.warn("PDF thumbnail failed", error);
        setThumbnail({ status: "failed" });
      });

    // The late result of a retired thumbnail is discarded above, so a slow
    // download can never update (or leak a file for) a screen that is gone.
    return () => {
      active = false;
      removeCacheFile(rendered);
    };
  }, [uri]);

  if (thumbnail.status === "ready") {
    return (
      <View style={style}>
        <Image
          testID="pdf-thumbnail-image"
          source={{ uri: thumbnail.uri }}
          contentFit="contain"
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View
      testID="pdf-thumbnail-placeholder"
      style={[
        style,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            thumbnail.status === "loading" ? colors.gray100 : undefined,
        },
      ]}
    >
      <IconFileText size={iconSize} color={colors.gray400} />
    </View>
  );
}
