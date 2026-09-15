import { cached, invalidate, invalidateVehicleScadenze, payloadVehicleId } from "./cache";
import { apiFetch } from "./http";

async function requestJson(url, options, fallbackError) {
    const response = await apiFetch(url, options);
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

export async function getAssicurazioni(vehicleId) {
    const params =
        vehicleId == null || vehicleId === ""
            ? ""
            : `?id_veicolo=${encodeURIComponent(vehicleId)}`;
    const key =
        vehicleId == null || vehicleId === ""
            ? "assicurazioni"
            : `assicurazioni:${vehicleId}`;
    return cached(key, () =>
        requestJson(
            `/api/assicurazioni${params}`,
            undefined,
            "Errore durante il recupero delle assicurazioni"
        )
    );
}

export async function getAssicurazione(id) {
    return cached(`assicurazione:${id}`, () =>
        requestJson(
            `/api/assicurazioni/${id}`,
            undefined,
            "Errore durante il recupero dell'assicurazione"
        )
    );
}

export async function addAssicurazione(assicurazione) {
    const data = await requestJson(
        "/api/assicurazioni",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assicurazione),
        },
        "Errore durante l'aggiunta dell'assicurazione"
    );
    invalidateVehicleScadenze(payloadVehicleId(assicurazione));
    return data;
}

export async function updateAssicurazione(id, assicurazione) {
    const data = await requestJson(
        `/api/assicurazioni/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assicurazione),
        },
        "Errore durante l'aggiornamento dell'assicurazione"
    );
    invalidate(`assicurazione:${id}`);
    invalidateVehicleScadenze(payloadVehicleId(assicurazione));
    return data;
}

export async function deleteAssicurazione(id, vehicleId) {
    const data = await requestJson(
        `/api/assicurazioni/${id}`,
        { method: "DELETE" },
        "Errore durante l'eliminazione dell'assicurazione"
    );
    invalidate(`assicurazione:${id}`);
    invalidateVehicleScadenze(vehicleId);
    return data;
}
