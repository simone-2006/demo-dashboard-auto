// http://localhost:5173/api/impostazioniEmail/giorniemail
import { cached, peek, setCache } from "./cache";
import { apiFetch } from "./http";

async function requestJson(url, fallbackError) {
    const response = await apiFetch(url);
    let data = {};
    try {
        data = await response.json();
    } catch {
        // leave data as {}
    }
    if (!response.ok) {
        throw new Error(data.error || fallbackError);
    }
    return data;
}

export async function getGiorniEmail() {
    return cached("email:giorni", async () => {
        const data = await requestJson(
            "/api/impostazioniEmail/giorniemail",
            "Errore durante il recupero dei giorni email"
        );
        return data;
    });
}

export async function updateAdminImpostazioniEmail(data) {
    const response = await apiFetch("/api/impostazioniEmail/updateadminimpostazioniemail", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
    let result = {};
    try {
        result = await response.json();
    } catch {
        // leave result as {}
    }
    if (!response.ok) {
        throw new Error(result.error || "Errore durante il salvataggio delle preferenze email admin");
    }
    const next = { ...(peek("email:giorni") || {}), admin: data };
    setCache("email:giorni", next);
    return next;
}

export async function updateProprietarioImpostazioniEmail(data) {
    const response = await apiFetch("/api/impostazioniEmail/updateproprietarioimpostazioniemail", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
    let result = {};
    try {
        result = await response.json();
    } catch {
        // leave result as {}
    }
    if (!response.ok) {
        throw new Error(result.error || "Errore durante il salvataggio delle preferenze email proprietario");
    }
    const next = { ...(peek("email:giorni") || {}), owner: data };
    setCache("email:giorni", next);
    return next;
}



/* email status active inactive (Config.Chiave = email-key) */

export async function getEmailStatus() {
    return cached("email:status", async () => {
        const data = await requestJson(
            "/api/impostazioniEmail/emailstatus",
            "Errore durante il recupero dello stato dell'attivazione email"
        );
        return data;
    });
}

export async function updateEmailStatus(emailStatus) {
    const response = await apiFetch("/api/impostazioniEmail/emailstatus", {
        method: "POST",
        body: JSON.stringify({ emailStatus }),
        headers: {
            "Content-Type": "application/json"
        }
    });
    let result = {};
    try {
        result = await response.json();
    } catch {
        // leave result as {}
    }
    if (!response.ok) {
        throw new Error(result.error || "Errore durante il salvataggio dello stato dell'attivazione email");
    }
    const next = { ...(peek("email:status") || {}), emailStatus: Boolean(result.emailStatus ?? emailStatus) };
    setCache("email:status", next);
    return next;
}