import base64
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "..", "apps", "mobile", "assets", "fonts")
# Usage: python3 build-payload.py <output.json>
# The payload embeds base64 fonts; write it outside the repo and don't commit it.
PAYLOAD_PATH = sys.argv[1] if len(sys.argv) > 1 else "/var/folders/40/q2myq6g91w5gbvrk46p9v8b80000gn/T/opencode/apt-otp/otp-payload.json"


def base64_font(name):
    with open(os.path.join(FONTS, name), "rb") as f:
        return base64.b64encode(f.read()).decode()


semibold = base64_font("Nunito-SemiBold.ttf")
bold = base64_font("Nunito-Bold.ttf")

style = f"""<style>
  @font-face {{
    font-family: 'Nunito';
    src: url(data:font/ttf;base64,{semibold}) format('truetype');
    font-weight: 600;
    font-style: normal;
  }}
  @font-face {{
    font-family: 'Nunito';
    src: url(data:font/ttf;base64,{bold}) format('truetype');
    font-weight: 700;
    font-style: normal;
  }}
</style>"""

def build(name):
    template = open(os.path.join(HERE, name)).read()
    return template.replace("</title>\n", "</title>\n" + style + "\n", 1)


html = build("otp.html")
recovery_html = build("recovery.html")
password_changed_html = build("password-changed.html")

payload = {
    "mailer_templates_magic_link_content": html,
    "mailer_subjects_magic_link": "Your APT verification code",
    "mailer_templates_confirmation_content": html,
    "mailer_subjects_confirmation": "Your APT verification code",
    "mailer_templates_recovery_content": recovery_html,
    "mailer_subjects_recovery": "Reset your APT password",
    "mailer_notifications_password_changed_enabled": True,
    "mailer_templates_password_changed_notification_content": password_changed_html,
    "mailer_subjects_password_changed_notification": "Your APT password was changed",
}

with open(PAYLOAD_PATH, "w") as f:
    json.dump(payload, f)

assert "@font-face" in html and "Nunito-SemiBold" not in html
assert "apt-logo.png" in html and 'width="96" height="96"' in html
assert "apt-logo-name.png" not in html
assert "font-weight: 600" in html and "font-weight: 700" in html
for template in (recovery_html, password_changed_html):
    assert "@font-face" in template and "apt-logo.png" in template
assert "{{ .Token }}" in recovery_html and "{{ .ConfirmationURL }}" not in recovery_html
assert "{{ .Token }}" not in password_changed_html
print("payload bytes:", len(json.dumps(payload)))
print("all checks passed")