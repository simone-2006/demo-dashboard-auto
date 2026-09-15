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

export async function getTagliandi(vehicleId) {
    const params =
        vehicleId == null || vehicleId === ""
            ? ""
            : `?id_veicolo=${encodeURIComponent(vehicleId)}`;
    const key =
        vehicleId == null || vehicleId === ""
            ? "tagliandi"
            : `tagliandi:${vehicleId}`;
    return cached(key, () =>
        requestJson(
            `/api/tagliandi${params}`,
            undefined,
            "Errore durante il recupero dei tagliandi"
        )
    );
}

export async function getTagliando(id) {
    return cached(`tagliando:${id}`, () =>
        requestJson(
            `/api/tagliandi/${id}`,
            undefined,
            "Errore durante il recupero del tagliando"
        )
    );
}

export async function addTagliando(tagliando) {
    const data = await requestJson(
        "/api/tagliandi",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tagliando),
        },
        "Errore durante l'aggiunta del tagliando"
    );
    invalidateVehicleScadenze(payloadVehicleId(tagliando));
    return data;
}

export async function updateTagliando(id, tagliando) {
    const data = await requestJson(
        `/api/tagliandi/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tagliando),
        },
        "Errore durante l'aggiornamento del tagliando"
    );
    invalidate(`tagliando:${id}`);
    invalidateVehicleScadenze(payloadVehicleId(tagliando));
    return data;
}

export async function deleteTagliando(id, vehicleId) {
    const data = await requestJson(
        `/api/tagliandi/${id}`,
        { method: "DELETE" },
        "Errore durante l'eliminazione del tagliando"
    );
    invalidate(`tagliando:${id}`);
    invalidateVehicleScadenze(vehicleId);
    return data;
}
