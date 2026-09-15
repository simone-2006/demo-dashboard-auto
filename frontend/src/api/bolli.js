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

export async function getBolli(vehicleId) {
    const params =
        vehicleId == null || vehicleId === ""
            ? ""
            : `?id_veicolo=${encodeURIComponent(vehicleId)}`;
    const key =
        vehicleId == null || vehicleId === "" ? "bolli" : `bolli:${vehicleId}`;
    return cached(key, () =>
        requestJson(
            `/api/bolli${params}`,
            undefined,
            "Errore durante il recupero dei bolli"
        )
    );
}

export async function getBollo(id) {
    return cached(`bollo:${id}`, () =>
        requestJson(
            `/api/bolli/${id}`,
            undefined,
            "Errore durante il recupero del bollo"
        )
    );
}

export async function addBollo(bollo) {
    const data = await requestJson(
        "/api/bolli",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bollo),
        },
        "Errore durante l'aggiunta del bollo"
    );
    invalidateVehicleScadenze(payloadVehicleId(bollo));
    return data;
}

export async function updateBollo(id, bollo) {
    const data = await requestJson(
        `/api/bolli/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bollo),
        },
        "Errore durante l'aggiornamento del bollo"
    );
    invalidate(`bollo:${id}`);
    invalidateVehicleScadenze(payloadVehicleId(bollo));
    return data;
}

export async function deleteBollo(id, vehicleId) {
    const data = await requestJson(
        `/api/bolli/${id}`,
        { method: "DELETE" },
        "Errore durante l'eliminazione del bollo"
    );
    invalidate(`bollo:${id}`);
    invalidateVehicleScadenze(vehicleId);
    return data;
}
