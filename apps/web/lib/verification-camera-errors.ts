/** User guidance only: camera access is not document authenticity or liveness proof. */
export function verificationCameraError(reason: string, userAgent: string): string {
  switch (reason) {
    case "insecure":
      return "Camera access requires a secure (HTTPS) page. Open APT using its HTTPS address, then try again.";
    case "unsupported":
      return "This browser does not support camera access. Open APT in an up-to-date browser with camera support.";
    case "NotAllowedError":
    case "PermissionDeniedError":
      if (/Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|FxiOS|OPiOS|Android/i.test(userAgent)) {
        return "Camera permission was denied. In Safari's page menu, open Website Settings and allow Camera. Also check Safari's camera access in device settings, then try again.";
      }
      if (/Chrome|Chromium|CriOS|Edg/i.test(userAgent)) {
        return "Camera permission was denied. Open the site controls beside the address bar and allow Camera. Also check your browser's camera access in device settings, then try again.";
      }
      return "Camera permission was denied. Allow Camera in this site's browser permissions and check your browser's camera access in device settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found. Connect or enable a camera, then try again.";
    case "OverconstrainedError":
      return "No suitable camera is available with these settings. Check that a camera is enabled, then try again.";
    case "SecurityError":
      return "Camera access is blocked by this browser or site. Check your browser's camera permissions or open APT directly in a supported browser.";
    case "ended":
      return "The camera stopped. Check your camera connection and permissions, then try again.";
    case "capture":
      return "The photo could not be captured. Try the camera again and wait for the preview before capturing.";
    default:
      return "The camera could not start. Close other apps or tabs using it, check your camera connection, then try again.";
  }
}
