import base64
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "..", "apps", "mobile", "assets", "fonts")
PAYLOAD_PATH = "/var/folders/40/q2myq6g91w5gbvrk46p9v8b80000gn/T/opencode/apt-otp/otp-payload.json"


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

html = open(os.path.join(HERE, "otp.html")).read()
html = html.replace("  <title>Your APT verification code</title>\n", "  <title>Your APT verification code</title>\n" + style + "\n", 1)

payload = {
    "mailer_templates_magic_link_content": html,
    "mailer_subjects_magic_link": "Your APT verification code",
    "mailer_templates_confirmation_content": html,
    "mailer_subjects_confirmation": "Your APT verification code",
}

with open(PAYLOAD_PATH, "w") as f:
    json.dump(payload, f)

assert "@font-face" in html and "Nunito-SemiBold" not in html
assert "apt-logo.png" in html and 'width="96" height="96"' in html
assert "apt-logo-name.png" not in html
assert "font-weight: 600" in html and "font-weight: 700" in html
print("payload bytes:", len(json.dumps(payload)))
print("all checks passed")