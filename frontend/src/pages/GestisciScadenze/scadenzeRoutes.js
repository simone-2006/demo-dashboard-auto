export const gestisciScadenzeBase = "/gestisci-scadenze";

export const scadenzeNavItems = [
  { title: "Riepilogo", slug: "riepilogo" },
  { title: "Assicurazione", slug: "assicurazione" },
  { title: "Bollo", slug: "bollo" },
  { title: "Revisione", slug: "revisione" },
  { title: "Tagliando", slug: "tagliando" },
];

export function gestisciScadenzePath(vehicleId, slug = "riepilogo") {
  if (vehicleId == null || vehicleId === "") return "/car";
  return `${gestisciScadenzeBase}/${vehicleId}/${slug}`;
}

export function gestisciScadenzeAddPath(vehicleId, slug = "assicurazione") {
  if (vehicleId == null || vehicleId === "") return "/car";
  return `${gestisciScadenzePath(vehicleId, slug)}/aggiungi`;
}

export function gestisciScadenzeEditPath(vehicleId, slug, recordId) {
  if (vehicleId == null || vehicleId === "" || recordId == null || recordId === "") {
    return "/car";
  }
  return `${gestisciScadenzePath(vehicleId, slug)}/modifica/${recordId}`;
}

export function pathForTipo(tipo, vehicleId) {
  const match = scadenzeNavItems.find(
    (item) => item.title.toLowerCase() === String(tipo ?? "").toLowerCase()
  );
  return gestisciScadenzePath(vehicleId, match?.slug ?? "riepilogo");
}
