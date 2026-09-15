import { cached, invalidate, invalidateVehicleScadenze, patchCache, peek, setCache } from "./cache";
import { apiFetch } from "./http";

export async function getVehicles() {
  return cached("vehicles", async () => {
    const response = await apiFetch("/api/vehicles");
    let data = {};
    try {
      data = await response.json();
    } catch {
      // leave data as {}
    }
    if (!response.ok) {
      throw new Error(data.error || "Errore durante il recupero dei veicoli");
    }
    const list = Array.isArray(data) ? data : [];
    for (const vehicle of list) {
      const id = vehicle.Id ?? vehicle.id;
      if (id == null) continue;
      const key = `vehicle:${id}`;
      if (peek(key) === undefined) setCache(key, vehicle);
    }
    return list;
  });
}

export async function getVehicle(vehicleId) {
  return cached(`vehicle:${vehicleId}`, async () => {
    const response = await apiFetch(`/api/vehicles/${vehicleId}`);
    let data = {};
    try {
      data = await response.json();
    } catch {
      // leave data as {}
    }
    if (!response.ok) {
      throw new Error(data.error || "Errore durante il recupero del veicolo");
    }
    return data;
  });
}

export async function addVehicle(vehicle) {
  const response = await apiFetch("/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicle),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    // leave data as {}
  }
  if (!response.ok) {
    throw new Error(data.error || "Errore durante l'aggiunta del veicolo");
  }
  invalidate("vehicles", "vehicles:count", "dashboard");
  return data;
}

export async function deleteVehicle(vehicleId) {
  const response = await apiFetch(`/api/vehicles/${vehicleId}`, {
    method: "DELETE",
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    // leave data as {}
  }
  if (!response.ok) {
    throw new Error(data.error || "Errore durante l'eliminazione del veicolo");
  }
  patchCache("vehicles", (list) =>
    Array.isArray(list)
      ? list.filter((item) => (item.Id ?? item.id) !== vehicleId)
      : list
  );
  invalidate(`vehicle:${vehicleId}`, "vehicles:count");
  invalidateVehicleScadenze(vehicleId);
  return data;
}

export async function updateVehicle(vehicleId, vehicle) {
  const response = await apiFetch(`/api/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vehicle),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    // leave data as {}
  }
  if (!response.ok) {
    throw new Error(data.error || "Errore durante l'aggiornamento del veicolo");
  }
  invalidate(`vehicle:${vehicleId}`, "vehicles", "dashboard");
  return data;
}

export async function getVehiclesNumber() {
  return cached("vehicles:count", async () => {
    const response = await apiFetch("/api/vehicles/count");
    let data = {};
    try {
      data = await response.json();
    } catch {
      // leave data as {}
    }
    if (!response.ok) {
      throw new Error(data.error || "Errore durante il recupero del numero di veicoli");
    }
    return data.count ?? 0;
  });
}
