// The page the captcha WebView loads. It reports back through
// ReactNativeWebView.postMessage: { type: "token" | "expired" | "error" |
// "interactive" | "done" }. `interaction-only` keeps the widget invisible
// unless Cloudflare needs the person to do something ("interactive").

export type CaptchaMessage =
  | { type: "token"; token: string }
  | { type: "expired" | "error" | "interactive" | "done" };

export const CAPTCHA_RESET_SCRIPT = "if (window.turnstile) { window.turnstile.reset(); } true;";

export function buildCaptchaPage(siteKey: string): string {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;background:transparent;display:flex;justify-content:center}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady" async defer></script>
</head><body><div id="widget"></div><script>
function post(message){window.ReactNativeWebView.postMessage(JSON.stringify(message));}
function onTurnstileReady(){
  turnstile.render('#widget',{
    sitekey:'${siteKey}',
    appearance:'interaction-only',
    theme:'auto',
    callback:function(token){post({type:'token',token:token});},
    'expired-callback':function(){post({type:'expired'});},
    'error-callback':function(){post({type:'error'});},
    'before-interactive-callback':function(){post({type:'interactive'});},
    'after-interactive-callback':function(){post({type:'done'});}
  });
}
</script></body></html>`;
}

export function parseCaptchaMessage(data: string): CaptchaMessage | null {
  try {
    const value = JSON.parse(data) as { type?: unknown; token?: unknown };
    if (value.type === "token" && typeof value.token === "string" && value.token) {
      return { type: "token", token: value.token };
    }
    if (value.type === "expired" || value.type === "error" || value.type === "interactive" || value.type === "done") {
      return { type: value.type };
    }
  } catch {
    // Not ours: ignore.
  }
  return null;
}

// Only the widget page and Cloudflare's own challenge hosts may load.
export function isAllowedCaptchaUrl(url: string, baseUrl: string): boolean {
  if (url === "about:blank" || url.startsWith(baseUrl)) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && (hostname === "challenges.cloudflare.com" || hostname.endsWith(".cloudflare.com"));
  } catch {
    return false;
  }
}
