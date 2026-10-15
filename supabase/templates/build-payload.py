import json
import os
import sys

# Builds the Management API payload for PATCH /v1/projects/{ref}/config/auth.
# Usage: python3 build-payload.py <output.json>
#
# Fonts load by <link> from Google Fonts — never embed them (base64): it pushes
# the email past Gmail's ~102 KB clipping limit, which hides the code, and past
# the dashboard editor's 50,000-character limit.

HERE = os.path.dirname(os.path.abspath(__file__))
GMAIL_CLIP_SAFE_CHARS = 50_000

if len(sys.argv) != 2:
    sys.exit("usage: python3 build-payload.py <output.json>")
PAYLOAD_PATH = sys.argv[1]


def load(name):
    with open(os.path.join(HERE, name)) as f:
        return f.read()


html = load("otp.html")
recovery_html = load("recovery.html")
password_changed_html = load("password-changed.html")
email_change_html = load("email-change.html")
email_changed_html = load("email-changed.html")

payload = {
    "mailer_templates_magic_link_content": html,
    "mailer_subjects_magic_link": "Your APT verification code",
    "mailer_templates_confirmation_content": html,
    "mailer_subjects_confirmation": "Your APT verification code",
    "mailer_templates_recovery_content": recovery_html,
    "mailer_subjects_recovery": "Reset your APT password",
    "mailer_templates_email_change_content": email_change_html,
    "mailer_subjects_email_change": "Confirm your new APT email",
    "mailer_notifications_password_changed_enabled": True,
    "mailer_templates_password_changed_notification_content": password_changed_html,
    "mailer_subjects_password_changed_notification": "Your APT password was changed",
    "mailer_notifications_email_changed_enabled": True,
    "mailer_templates_email_changed_notification_content": email_changed_html,
    "mailer_subjects_email_changed_notification": "Your APT email was changed",
}

for template in (html, recovery_html, password_changed_html, email_change_html, email_changed_html):
    assert len(template) < GMAIL_CLIP_SAFE_CHARS, "template too large for Gmail/dashboard"
    assert "base64" not in template
    assert "fonts.googleapis.com/css2?family=Nunito" in template
    assert "apt-logo.png" in template and 'width="96" height="96"' in template
assert "{{ .Token }}" in html and "{{ .Token }}" in recovery_html
assert "{{ .Token }}" in email_change_html
assert "{{ .NewEmail }}" in email_change_html
assert "{{ .ConfirmationURL }}" not in recovery_html
assert "{{ .ConfirmationURL }}" not in email_change_html
assert "{{ .Token }}" not in password_changed_html
assert "{{ .OldEmail }}" in email_changed_html

with open(PAYLOAD_PATH, "w") as f:
    json.dump(payload, f)

print("payload bytes:", len(json.dumps(payload)))
print("all checks passed")
