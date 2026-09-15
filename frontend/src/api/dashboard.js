import { cached } from "./cache";
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

export async function getScaduteNumber() {
    return cached("dashboard:scadute", async () => {
        const data = await requestJson(
            "/api/dashboard/scadute",
            "Errore durante il recupero delle scadenze scadute"
        );
        return data.count ?? 0;
    });
}

export async function getScadenze() {
    return cached("dashboard:scadenze", async () => {
        const data = await requestJson(
            "/api/dashboard/scadenze",
            "Errore durante il recupero delle scadenze"
        );
        return Array.isArray(data) ? data : [];
    });
}
