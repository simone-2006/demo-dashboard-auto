const values = new Map();
const inflight = new Map();

function matches(key, prefix) {
  return key === prefix || key.startsWith(`${prefix}:`);
}

export function peek(key) {
  return values.has(key) ? values.get(key) : undefined;
}

export function setCache(key, value) {
  values.set(key, value);
}

export function patchCache(key, updater) {
  if (!values.has(key)) return;
  values.set(key, updater(values.get(key)));
}

export function cached(key, fn) {
  if (values.has(key)) return Promise.resolve(values.get(key));
  if (inflight.has(key)) return inflight.get(key);

  const pending = Promise.resolve()
    .then(fn)
    .then((data) => {
      values.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, pending);
  return pending;
}

export function invalidate(...prefixes) {
  for (const prefix of prefixes) {
    if (prefix == null || prefix === "") continue;
    for (const key of [...values.keys()]) {
      if (matches(key, prefix)) values.delete(key);
    }
    for (const key of [...inflight.keys()]) {
      if (matches(key, prefix)) inflight.delete(key);
    }
  }
}

export function invalidateVehicleScadenze(vehicleId) {
  if (vehicleId == null || vehicleId === "") {
    invalidate("scadenze", "assicurazioni", "bolli", "revisioni", "tagliandi");
  } else {
    invalidate(
      `scadenze:${vehicleId}`,
      `assicurazioni:${vehicleId}`,
      `bolli:${vehicleId}`,
      `revisioni:${vehicleId}`,
      `tagliandi:${vehicleId}`
    );
  }
  invalidate("dashboard");
}

export function payloadVehicleId(body) {
  return body?.Id_veicolo ?? body?.Id_Veicolo ?? body?.id_veicolo ?? null;
}
