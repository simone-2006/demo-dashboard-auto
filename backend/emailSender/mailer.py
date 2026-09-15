import os
import smtplib
import sys
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from email.message import EmailMessage
from html import escape
from string import Template
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import requests

import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
ROME_TZ = ZoneInfo("Europe/Rome")

load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# Demo: il mailer resta nel repo ma non invia.
DEMO_EMAIL_DISABLED = True


def parse_emails(value):
    if isinstance(value, list):
        items = value
    else:
        items = str(value).replace(";", ",").split(",")
    return [email.strip() for email in items if str(email).strip()]


def load_admin_emails():
    env_value = os.getenv("ADMIN_EMAILS")
    if env_value:
        return parse_emails(env_value)

    paths = [
        os.getenv("ADMIN_EMAIL_FILE"),
        os.path.join(BASE_DIR, "adminEmail.json"),
        os.path.join(PROJECT_DIR, "frontend", "src", "companyData", "adminEmail.json"),
    ]
    for path in paths:
        if path and os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as file:
                return json.load(file)
    raise FileNotFoundError(
        "Nessun elenco email admin: imposta ADMIN_EMAILS oppure fornisci adminEmail.json"
    )


EMAIL_TO = parse_emails(load_admin_emails())

TIPO_KEYS = ("assicurazione", "bollo", "revisione", "tagliando")


def is_valid_email(email):
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is not None


def render_template(filename, **dati):
    path = os.path.join(BASE_DIR, "templates", filename)
    with open(path, "r", encoding="utf-8") as file:
        return Template(file.read()).safe_substitute(**dati)


def send_email(to_emails, subject, html):
    if DEMO_EMAIL_DISABLED:
        print("Invio email disattivato in questa demo")
        return False

    recipients = parse_emails(to_emails)
    print(f"Tentativo di invio email a {', '.join(recipients)}...")
    if not is_valid_email(SMTP_USER):
        print(f"Errore: L'indirizzo email del mittente non è valido: {SMTP_USER!r}")
        return False

    invalid = [email for email in recipients if not is_valid_email(email)]
    if not recipients:
        print("Errore: Nessun destinatario")
        return False
    if invalid:
        print(f"Errore: Indirizzi email destinatario non validi: {invalid!r}")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = ", ".join(recipients)
    msg.set_content("Apri questa email con un client che supporta HTML.")
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        print("Email inviata con successo!")
        return True
    except smtplib.SMTPRecipientsRefused as e:
        print(f"Errore: Destinatario rifiutato: {e}")
    except smtplib.SMTPResponseException as e:
        print(f"Errore SMTP durante l'invio dell'email: ({e.smtp_code}, {e.smtp_error})")
    except Exception as e:
        print(f"Errore durante l'invio dell'email: {e}")
    return False


def normalize_base_url(url):
    url = (url or "").strip().strip("'\"")
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    return url.rstrip("/")


DEFAULT_SERVER_ADDRESS = normalize_base_url(os.getenv("DEFAULT_SERVER_ADDRESS", ""))


def getGiorniEmail():
    if not DEFAULT_SERVER_ADDRESS:
        print("Errore: DEFAULT_SERVER_ADDRESS non è impostato nel .env")
        return None
    url = f"{DEFAULT_SERVER_ADDRESS}/api/impostazioniEmail/giorniemail"
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException as e:
        print(f"Errore nel recupero dei giorni email: {e}")
        return None

    if response.status_code == 200:
        return response.json()
    print("Errore nel recupero dei giorni email:", response.status_code)
    return None


def getEmailStatus():
    if not DEFAULT_SERVER_ADDRESS:
        print("Errore: DEFAULT_SERVER_ADDRESS non è impostato nel .env")
        return None
    url = f"{DEFAULT_SERVER_ADDRESS}/api/impostazioniEmail/emailstatus"
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException as e:
        print(f"Errore nel recupero dello stato email: {e}")
        return None

    if response.status_code == 200:
        return response.json()
    print("Errore nel recupero dello stato email:", response.status_code)
    return None


def is_email_active(value):
    if value is True or value == 1:
        return True
    if value is False or value == 0 or value is None:
        return False
    return str(value).strip().lower() in ("true", "1", "yes", "on")


def getScadenzeAuto():
    if not DEFAULT_SERVER_ADDRESS:
        print("Errore: DEFAULT_SERVER_ADDRESS non è impostato nel .env")
        return None
    url = f"{DEFAULT_SERVER_ADDRESS}/api/dashboard/scadenze"
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException as e:
        print(f"Errore nel recupero delle scadenze: {e}")
        return None

    if response.status_code == 200:
        return response.json()
    print("Errore nel recupero delle scadenze:", response.status_code)
    return None


def tipo_key(tipo):
    return str(tipo or "").strip().lower()


def parse_scadenza(value):
    if not value:
        return None
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        try:
            return date.fromisoformat(text[:10])
        except ValueError:
            return None


def giorni_alla_scadenza(value):
    scadenza = parse_scadenza(value)
    if scadenza is None:
        return None
    return (scadenza - date.today()).days


def soglia_per_tipo(impostazioni, tipo):
    if not isinstance(impostazioni, dict):
        return None
    key = tipo_key(tipo)
    if key not in TIPO_KEYS:
        return None
    raw = impostazioni.get(key)
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def con_giorni_rimanenti(scadenze):
    result = []
    for item in scadenze or []:
        giorni = giorni_alla_scadenza(item.get("scadenza"))
        if giorni is None:
            continue
        riga = dict(item)
        riga["giorni_rimanenti"] = giorni
        result.append(riga)
    return result


def scadenze_in_soglia(scadenze, impostazioni):
    matched = []
    for item in con_giorni_rimanenti(scadenze):
        soglia = soglia_per_tipo(impostazioni, item.get("tipo"))
        if soglia is None or item["giorni_rimanenti"] != soglia:
            continue
        matched.append(item)
    return matched


def scadenze_gia_scadute(scadenze):
    scadute = [item for item in con_giorni_rimanenti(scadenze) if item["giorni_rimanenti"] < 0]
    scadute.sort(key=lambda item: item["giorni_rimanenti"])
    return scadute


def format_data_it(value):
    scadenza = parse_scadenza(value)
    if scadenza is None:
        return "—"
    return scadenza.strftime("%d/%m/%Y")


def safe_text(value, fallback="—"):
    text = str(value).strip() if value is not None else ""
    if not text:
        text = fallback
    return escape(text).replace("$", "$$")


def etichetta_giorni(giorni):
    if giorni is None:
        return "—"
    if giorni == 0:
        return "oggi"
    if giorni < 0:
        n = -giorni
        return f"scaduta da {n} giorno" if n == 1 else f"scaduta da {n} giorni"
    return str(giorni)


def etichetta_veicolo(item):
    veicolo = " ".join(
        part for part in (item.get("Brand"), item.get("Modello")) if part
    )
    targa = item.get("Targa")
    if targa:
        veicolo = f"{veicolo} ({targa})".strip()
    assegnatario = item.get("Assegnazione")
    if assegnatario:
        veicolo = f"{veicolo} — {assegnatario}"
    return veicolo


def riga_scadenza_html(item, tone="default"):
    giorni_testo = safe_text(etichetta_giorni(item.get("giorni_rimanenti")))
    if tone == "preavviso":
        cell = "border-bottom:1px solid #5eead4;color:#134e4a;font-size:14px;padding:10px 8px;"
        row = ' style="background:#ccfbf1;"'
        veicolo = f'<strong>{safe_text(etichetta_veicolo(item))}</strong>'
        giorni = (
            '<span style="display:inline-block;background:#0f766e;color:#ffffff;'
            'font-weight:bold;font-size:14px;padding:4px 10px;">'
            f"{giorni_testo}</span>"
        )
    elif tone == "warning":
        cell = "border-bottom:1px solid #fed7aa;color:#9a3412;font-size:12px;"
        row = ' style="background:#fff7ed;"'
        veicolo = safe_text(etichetta_veicolo(item))
        giorni = giorni_testo
    else:
        cell = "border-bottom:1px solid #e4e4e7;"
        row = ""
        veicolo = safe_text(etichetta_veicolo(item))
        giorni = giorni_testo
    return (
        f"<tr{row}>"
        f'<td style="{cell}">{veicolo}</td>'
        f'<td style="{cell}">{safe_text(item.get("tipo"))}</td>'
        f'<td style="{cell}">{safe_text(format_data_it(item.get("scadenza")))}</td>'
        f'<td style="{cell}">{giorni}</td>'
        "</tr>"
    )


def tabella_scadenze_html(items, tone="default"):
    if tone == "preavviso":
        head_cell = (
            "border-bottom:2px solid #0f766e;color:#134e4a;text-align:left;"
            "font-size:13px;"
        )
        head_row = ' style="background:#99f6e4;"'
        giorni_header = "Giorni rimanenti"
        font_size = "14px"
    elif tone == "warning":
        head_cell = "border-bottom:1px solid #fdba74;color:#9a3412;text-align:left;"
        head_row = ' style="background:#ffedd5;"'
        giorni_header = "Ritardo"
        font_size = "12px"
    else:
        head_cell = "border-bottom:1px solid #e4e4e7;text-align:left;"
        head_row = ' style="background:#f4f4f5;"'
        giorni_header = "Giorni rimanenti alla scadenza"
        font_size = "13px"
    righe = "\n".join(riga_scadenza_html(item, tone=tone) for item in items)
    return (
        '<table role="presentation" width="100%" cellpadding="8" cellspacing="0" '
        f'style="border-collapse:collapse;font-size:{font_size};">'
        f"<tr{head_row}>"
        f'<th style="{head_cell}">Veicolo</th>'
        f'<th style="{head_cell}">Tipo</th>'
        f'<th style="{head_cell}">Scadenza</th>'
        f'<th style="{head_cell}">{giorni_header}</th>'
        "</tr>"
        f"{righe}"
        "</table>"
    )


def blocco_preavviso_html(items):
    if not items:
        return '<p style="margin:0;">Nessuna scadenza in preavviso oggi.</p>'
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="border:3px solid #0f766e;">'
        "<tr>"
        '<td style="background:#0f766e;color:#ffffff;padding:14px 16px;'
        'font-size:16px;font-weight:bold;">'
        "Da gestire: scadenze in preavviso"
        "</td>"
        "</tr>"
        '<tr>'
        '<td style="background:#f0fdfa;padding:14px 16px;">'
        '<p style="margin:0 0 12px 0;color:#134e4a;font-size:14px;font-weight:bold;">'
        "Queste scadenze richiedono attenzione oggi."
        "</p>"
        f"{tabella_scadenze_html(items, tone='preavviso')}"
        "</td>"
        "</tr>"
        "</table>"
    )


def blocco_scadute_html(items):
    if not items:
        return ""
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="margin-top:24px;border:1px solid #f59e0b;">'
        "<tr>"
        '<td style="background:#f59e0b;color:#ffffff;padding:10px 16px;'
        'font-size:13px;font-weight:bold;">'
        "Attenzione: scadenze già superate"
        "</td>"
        "</tr>"
        '<tr>'
        '<td style="background:#fff7ed;padding:12px 16px;">'
        '<p style="margin:0 0 12px 0;color:#9a3412;font-size:12px;">'
        "Queste scadenze risultano già oltre la data prevista."
        "</p>"
        f"{tabella_scadenze_html(items, tone='warning')}"
        "</td>"
        "</tr>"
        "</table>"
    )


def html_scadenze(titolo, intro, items, scadute=None):
    return render_template(
        "scadenza.html",
        titolo=titolo,
        intro=intro,
        blocco_preavviso=blocco_preavviso_html(items),
        blocco_scadute=blocco_scadute_html(scadute or []),
    )


def raggruppa_per_owner(items):
    grouped = defaultdict(list)
    for item in items:
        email = (item.get("EmailAssegnatario") or "").strip()
        if not is_valid_email(email):
            print(
                f"Salto scadenza {item.get('Targa')} ({item.get('tipo')}): "
                "nessuna email assegnatario valida"
            )
            continue
        grouped[email].append(item)
    return grouped


def run():
    print("Job email scadenze avviato.")

    status_data = getEmailStatus()
    raw_status = status_data.get("emailStatus") if isinstance(status_data, dict) else None
    active = is_email_active(raw_status)
    print(
        f"Stato email (Config.email-key): valore={raw_status!r} → "
        f"{'ATTIVO' if active else 'DISATTIVO'}"
    )
    if not active:
        print("Invio email disattivato da impostazioni. Job terminato senza invii.")
        return

    giorni = getGiorniEmail()
    scadenze = getScadenzeAuto()
    if not isinstance(giorni, dict):
        print("Impossibile procedere: impostazioni giorni non disponibili.")
        return
    if not isinstance(scadenze, list):
        print("Impossibile procedere: elenco scadenze non disponibile.")
        return

    admin_items = scadenze_in_soglia(scadenze, giorni.get("admin"))
    owner_items = scadenze_in_soglia(scadenze, giorni.get("owner"))
    scadute = scadenze_gia_scadute(scadenze)
    print(
        f"Scadenze in soglia: {len(admin_items)} admin, {len(owner_items)} proprietari; "
        f"già scadute: {len(scadute)}"
    )

    if admin_items or scadute:
        html = html_scadenze(
            "Scadenze automobili",
            "Queste scadenze cadono oggi nel preavviso configurato.",
            admin_items,
            scadute=scadute,
        )
        send_email(EMAIL_TO, "Comunicazione scadenze automobili", html)
    else:
        print("Nessuna scadenza in soglia per gli amministratori.")

    for email, items in raggruppa_per_owner(owner_items).items():
        nome = items[0].get("Assegnazione") or ""
        saluto = f"Ciao {nome}," if nome else "Ciao,"
        html = html_scadenze(
            "Scadenza automezzo assegnato",
            f"{saluto} l'automezzo assegnato ha una scadenza nel preavviso configurato.",
            items,
        )
        send_email([email], "Scadenza automezzo assegnato", html)


def seconds_until_next_run(hour, minute):
    now = datetime.now(ROME_TZ)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if now >= target:
        target += timedelta(days=1)
    return (target - now).total_seconds()


def run_scheduled(hour=8, minute=0):
    print(
        f"Scheduler attivo: invio ogni giorno alle {hour:02d}:{minute:02d} "
        f"({ROME_TZ.key})."
    )
    while True:
        wait = seconds_until_next_run(hour, minute)
        next_at = datetime.now(ROME_TZ) + timedelta(seconds=wait)
        print(f"Prossimo job: {next_at.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        time.sleep(wait)
        try:
            run()
        except Exception as e:
            print(f"Errore durante il job email: {e}")


if __name__ == "__main__":
    if "--schedule" in sys.argv:
        run_scheduled()
    else:
        run()
