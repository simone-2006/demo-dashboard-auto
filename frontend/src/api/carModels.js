const CATALOG_BASE = import.meta.env.DEV
  ? "/fleetcatalog"
  : "https://fleetcatalog.disturbingbyte.pt";

async function catalogGet(path, { signal } = {}) {
  const response = await fetch(`${CATALOG_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Catalog ${response.status}`);
  }
  return response.json();
}

function itemsOf(data) {
  return Array.isArray(data?.items) ? data.items : [];
}

/**
 * Cerca marche nel catalogo Garage (appByte Vehicle Catalog).
 * @param {string} search
 * @param {{ pageSize?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<Array<{ id: string, name: string, country?: string | null }>>}
 */
export async function searchMakes(search, { pageSize = 8, signal } = {}) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  params.set("pageSize", String(pageSize));
  const data = await catalogGet(`/v1/makes?${params}`, { signal });
  return itemsOf(data);
}

/**
 * Cerca modelli di una marca.
 * @param {string} makeId
 * @param {string} [search]
 * @param {{ pageSize?: number, signal?: AbortSignal }} [options]
 */
export async function searchModels(makeId, search = "", { pageSize = 8, signal } = {}) {
  if (!makeId) return [];
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  params.set("pageSize", String(pageSize));
  const data = await catalogGet(`/v1/makes/${makeId}/models?${params}`, { signal });
  return itemsOf(data);
}

/**
 * Trova una marca univoca dal testo libero (match esatto, altrimenti un solo risultato).
 * @param {string} brand
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function resolveMake(brand, { signal } = {}) {
  const query = brand?.trim();
  if (!query) return null;
  const items = await searchMakes(query, { pageSize: 20, signal });
  if (!items.length) return null;
  const lower = query.toLowerCase();
  const exact = items.find((make) => make.name.toLowerCase() === lower);
  if (exact) return exact;
  return items.length === 1 ? items[0] : null;
}

/**
 * Suggerimenti modello a partire da marca (id o testo) e query modello.
 * @param {{ makeId?: string, make?: string, model?: string }} query
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getCarModels(query = {}, { signal } = {}) {
  const makeId =
    query.makeId || (await resolveMake(query.make, { signal }))?.id;
  if (!makeId) return [];
  return searchModels(makeId, query.model, { signal });
}
