import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";

import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import CarCard from "../components/ui/CarCard";
import { useCachedResource } from "../hooks/useCachedResource";
import { getVehicles } from "../api/vehicles";
import { useSessionState } from "../hooks/navigation";

import Input from "../components/ui/Input";

function uniqueValues(items, getter) {
  const seen = new Map();
  for (const item of items) {
    const value = String(getter(item) ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, "it", { sensitivity: "base" })
  );
}

function searchText(vehicle) {
  return [
    vehicle.Brand,
    vehicle.Modello,
    vehicle.Targa,
    vehicle.Assegnazione,
    vehicle.Contratto,
    vehicle.Note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isTelepassOn(value) {
  return value === true || value === 1 || value === "1";
}

export default function Car() {
  const { data, loading, error, setData: setVehicles } = useCachedResource(
    "vehicles",
    getVehicles
  );
  const vehicles = Array.isArray(data) ? data : [];
  const [filters, setFilters] = useSessionState("filters:/car", {
    query: "",
    brand: "",
    ownership: "",
    telepass: "",
  });
  const query = filters.query ?? "";
  const brand = filters.brand ?? "";
  const ownership = filters.ownership ?? "";
  const telepass = filters.telepass ?? "";

  function setQuery(value) {
    setFilters((prev) => ({ ...prev, query: value }));
  }
  function setBrand(value) {
    setFilters((prev) => ({ ...prev, brand: value }));
  }
  function setOwnership(value) {
    setFilters((prev) => ({ ...prev, ownership: value }));
  }
  function setTelepass(value) {
    setFilters((prev) => ({ ...prev, telepass: value }));
  }

  const brands = useMemo(
    () => uniqueValues(vehicles, (vehicle) => vehicle.Brand),
    [vehicles]
  );

  const hasFilters = Boolean(query.trim() || brand || ownership || telepass);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (q && !searchText(vehicle).includes(q)) return false;
      if (brand && (vehicle.Brand ?? "").trim().toLowerCase() !== brand.toLowerCase()) {
        return false;
      }
      if (ownership && (vehicle.ProprietaLeasing ?? "") !== ownership) return false;
      if (telepass === "si" && !isTelepassOn(vehicle.TelepassSINO)) return false;
      if (telepass === "no" && isTelepassOn(vehicle.TelepassSINO)) return false;
      return true;
    });
  }, [vehicles, query, brand, ownership, telepass]);

  function resetFilters() {
    setFilters({ query: "", brand: "", ownership: "", telepass: "" });
  }

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center bg-bg-secondary py-2">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border px-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 bg-bg">
            <Search size={14} aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca marca, modello, targa..."
              aria-label="Cerca auto"
              className="border-x-transparent focus:ring-transparent! focus:border-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-text-muted hover:text-text"
                aria-label="Cancella ricerca"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="sm:w-44"
              aria-label="Filtra per marca"
            >
              <option value="">Tutte le marche</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
              className="sm:w-44"
              aria-label="Filtra per proprietà"
            >
              <option value="">Proprietà / Leasing</option>
              <option value="proprietà">Proprietà</option>
              <option value="leasing">Leasing</option>
            </Select>
            <Select
              value={telepass}
              onChange={(e) => setTelepass(e.target.value)}
              className="sm:w-36"
              aria-label="Filtra per Telepass"
            >
              <option value="">Telepass</option>
              <option value="si">Con Telepass</option>
              <option value="no">Senza Telepass</option>
            </Select>
          </div>
          {hasFilters ? (
            <Button type="button" variant="ghost" size="md" onClick={resetFilters}>
              <div className="flex items-center gap-1">
                <X size={12}></X>
                Azzera filtri
              </div>
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-xs text-text-muted">
        {loading
          ? "Caricamento..."
          : `${filtered.length} di ${vehicles.length} auto`}
      </p>

      {error ? (
        <p className="mt-4 text-sm text-critical">{error.message || error}</p>
      ) : loading ? null : vehicles.length === 0 ? (
        <div className="bg-bg rounded-md shadow-lg p-6 mt-2 text-center">
          <p className="font-medium text-text">Nessuna auto in elenco</p>
          <p className="mt-1 text-sm text-text-secondary">
            Aggiungi la prima auto della flotta.
          </p>
          <Link to="/addCar" className="inline-block mt-3">
            <Button type="button" size="md">
              Aggiungi macchina
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg rounded-md shadow-lg p-6 mt-2 text-center">
          <p className="font-medium text-text">Nessun risultato</p>
          <p className="mt-1 text-sm text-text-secondary">
            Prova a cambiare ricerca o filtri.
          </p>
          <Button type="button" variant="ghost" size="md" className="mt-3" onClick={resetFilters}>
            Azzera filtri
          </Button>
        </div>
      ) : (
        filtered.map((macchina, idx) => (
          <CarCard
            key={macchina.Id ?? macchina.id ?? idx}
            macchina={macchina}
            onDeleted={(id) =>
              setVehicles((prev) =>
                prev.filter((v) => (v.Id ?? v.id) !== id)
              )
            }
          />
        ))
      )}
    </>
  );
}
