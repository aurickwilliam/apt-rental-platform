import { useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { CAPTCHA_BASE_URL, CAPTCHA_ENABLED, CAPTCHA_SITE_KEY } from "@/constants/captcha";
import {
  buildCaptchaPage,
  CAPTCHA_RESET_SCRIPT,
  isAllowedCaptchaUrl,
  parseCaptchaMessage,
} from "@/service/auth/captchaPage";

export interface CaptchaHandle {
  /** The current single-use token, or undefined while the check is unfinished. */
  getToken(): string | undefined;
  /** Discards the used token and asks for a new one. */
  reset(): void;
}

const CHALLENGE_HEIGHT = 80;

// Invisible Cloudflare Turnstile check. It takes space only while Cloudflare
// needs the person to interact. Renders nothing when the protection is off.
export default function CaptchaWidget({ ref }: { ref?: React.Ref<CaptchaHandle> }) {
  const webViewRef = useRef<WebView>(null);
  const tokenRef = useRef<string | undefined>(undefined);
  const [interactive, setInteractive] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      getToken: () => tokenRef.current,
      reset: () => {
        tokenRef.current = undefined;
        webViewRef.current?.injectJavaScript(CAPTCHA_RESET_SCRIPT);
      },
    }),
    [],
  );

  if (!CAPTCHA_ENABLED) return null;

  const handleMessage = (event: WebViewMessageEvent) => {
    const message = parseCaptchaMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === "token") {
      tokenRef.current = message.token;
      setInteractive(false);
    } else if (message.type === "interactive") {
      setInteractive(true);
    } else if (message.type === "done") {
      setInteractive(false);
    } else {
      tokenRef.current = undefined;
    }
  };

  return (
    <View
      style={{ height: interactive ? CHALLENGE_HEIGHT : 0, overflow: "hidden" }}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? "auto" : "no-hide-descendants"}
    >
      <WebView
        ref={webViewRef}
        source={{ html: buildCaptchaPage(CAPTCHA_SITE_KEY), baseUrl: CAPTCHA_BASE_URL }}
        originWhitelist={["https://*", "about:blank"]}
        onShouldStartLoadWithRequest={(request) => isAllowedCaptchaUrl(request.url, CAPTCHA_BASE_URL)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
