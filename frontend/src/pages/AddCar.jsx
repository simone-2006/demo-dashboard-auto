import { useCallback, useState } from "react";
import { getCarModels, searchMakes } from "../api/carModels";
import { addVehicle } from "../api/vehicles";
import Page from "../components/layout/Page";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import SuggestInput from "../components/ui/SuggestInput";
import Textarea from "../components/ui/Textarea";
import CarNameLogo from "../components/ui/CarNameLogo";

import Title from "../components/ui/Title";

import Field from "../components/ui/Field";
import CompanySelect from "../components/ui/CompanySelect";
import BackButton from "../components/ui/BackButton";
import UnsavedChangesDialog from "../components/ui/UnsavedChangesDialog";
import { getCarsListPath, useGoBack } from "../hooks/navigation";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

import { toastError, toastSuccess } from "../hooks/toast";

export default function AddCar() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [selectedMakeId, setSelectedMakeId] = useState(null);
  const [targa, setTarga] = useState("");
  const [immatricolazione, setImmatricolazione] = useState("");
  const [proprietaLeasing, setProprietaLeasing] = useState("");
  const [contratto, setContratto] = useState("");
  const [telepassSiNo, setTelepassSiNo] = useState("no");
  const [telepassNumero, setTelepassNumero] = useState("");
  const [assegnazione, setAssegnazione] = useState("");
  const [email, setEmail] = useState("");
  const [secondaChiave, setSecondaChiave] = useState("");
  const [azienda, setAzienda] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const goBack = useGoBack(getCarsListPath());

  const {
    confirmOpen,
    confirmLeave,
    cancelLeave,
    allowLeaveAnd,
  } = useUnsavedChanges({
    brand,
    model,
    targa,
    immatricolazione,
    proprietaLeasing,
    contratto,
    telepassSiNo,
    telepassNumero,
    assegnazione,
    email,
    secondaChiave,
    azienda,
    note,
  });

  const fetchMakeSuggestions = useCallback(async (query, signal) => {
    const makes = await searchMakes(query, { signal });
    return makes.map((make) => ({
      id: make.id,
      label: make.name,
      meta: make.country || undefined,
    }));
  }, []);

  const fetchModelSuggestions = useCallback(
    async (query, signal) => {
      const models = await getCarModels(
        { makeId: selectedMakeId, make: brand, model: query },
        { signal }
      );
      return models.map((item) => ({
        id: item.id,
        label: item.name,
      }));
    },
    [brand, selectedMakeId]
  );

  function handleBrandChange(next) {
    setBrand(next);
    setSelectedMakeId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !targa.trim() || saving) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await addVehicle({
        Brand: brand,
        Modello: model,
        Immatricolazione: immatricolazione || null,
        ProprietaLeasing: proprietaLeasing || null,
        Contratto: contratto || null,
        TelepassSINO: telepassSiNo === "si",
        TelepassNumero: telepassSiNo === "si" ? telepassNumero : null,
        SecondaChiave: secondaChiave || null,
        Assegnazione: assegnazione || null,
        EmailAssegnatario: email || null,
        Targa: targa.trim(),
        Azienda: azienda || null,
        Note: note || null,
      });
      toastSuccess(`Macchina ${brand + " " + model}  aggiunta con successo`)
      allowLeaveAnd(goBack);
    } catch (err) {
      setSubmitError(err.message || "Errore durante il salvataggio");
      toastError("Errore nell'inserimento della macchina")
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <Title
        left={
          <div className="flex gap-1 items-center">
            <BackButton fallback={getCarsListPath()} />
            <h2 className="font-bold text-text text-xl">Aggiungi macchina</h2>
          </div>
        }
        right={
          <CarNameLogo macchina={{
            Brand: brand,
            Modello: model,
            Immatricolazione: immatricolazione || null,
            ProprietaLeasing: proprietaLeasing || null,
            Contratto: contratto || null,
            TelepassSINO: telepassSiNo === "si",
            TelepassNumero: telepassSiNo === "si" ? telepassNumero : null,
            SecondaChiave: secondaChiave || null,
            Assegnazione: assegnazione || null,
            Targa: targa.trim(),
            Note: note || null,
          }}></CarNameLogo>
        }
      >

      </Title>


      <div className="w-full">
        <form
          className="bg-bg rounded-md shadow-lg p-4 mt-2 w-full space-y-4"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="brand" label="Marca" required>
              <SuggestInput
                id="brand"
                placeholder="Es. Fiat"
                value={brand}
                onChange={handleBrandChange}
                onSelect={(item) => setSelectedMakeId(item.id)}
                fetchSuggestions={fetchMakeSuggestions}
                emptyMessage="Nessuna marca trovata"
              />
            </Field>
            <Field id="model" label="Modello" required>
              <SuggestInput
                id="model"
                placeholder="Es. Panda"
                value={model}
                onChange={setModel}
                fetchSuggestions={fetchModelSuggestions}
                minChars={0}
                canSuggest={Boolean(brand.trim())}
                emptyMessage={
                  brand.trim()
                    ? "Nessun modello trovato"
                    : "Inserisci la marca per i suggerimenti"
                }
              />
            </Field>
            <Field id="targa" label="Targa" required>
              <Input
                id="targa"
                type="text"
                placeholder="AB123CD"
                value={targa}
                onChange={(e) => setTarga(e.target.value.replace(/\s/g, "").toUpperCase())}
                autoComplete="off"
                maxLength={10}
              />
            </Field>

            <Field id="immatricolazione" label="Immatricolazione">
              <Input
                id="immatricolazione"
                type="date"
                value={immatricolazione}
                onChange={(e) => setImmatricolazione(e.target.value)}
              />
            </Field>
            <Field id="proprietaLeasing" label="Proprietà / Leasing">
              <Select
                id="proprietaLeasing"
                value={proprietaLeasing}
                onChange={(e) => setProprietaLeasing(e.target.value)}
              >
                <option value="">Seleziona...</option>
                <option value="proprietà">Proprietà</option>
                <option value="leasing">Leasing</option>
              </Select>
            </Field>
            <Field id="contratto" label="Contratto">
              <Input
                id="contratto"
                type="text"
                placeholder="Contratto"
                value={contratto}
                onChange={(e) => setContratto(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Telepass">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-md border border-border">
                {[
                  { value: "si", label: "Sì" },
                  { value: "no", label: "No" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded px-3 py-1 text-sm select-none ${telepassSiNo === opt.value
                      ? "bg-brand text-on-brand"
                      : "text-text hover:bg-bg-secondary"
                      }`}
                  >
                    <Input
                      type="radio"
                      name="telepass"
                      value={opt.value}
                      checked={telepassSiNo === opt.value}
                      onChange={(e) => setTelepassSiNo(e.target.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {telepassSiNo === "si" && (
                <Input
                  id="telepassNumero"
                  type="text"
                  placeholder="Numero Telepass"
                  value={telepassNumero}
                  onChange={(e) => setTelepassNumero(e.target.value)}
                  className="max-w-xs"
                />
              )}
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="assegnazione" label="Assegnazione">
              <Input
                id="assegnazione"
                type="text"
                placeholder="Assegnata a"
                value={assegnazione}
                onChange={(e) => setAssegnazione(e.target.value)}
              />
            </Field>
            <Field id="EmailAssegnatario" label="Email">
              <Input
                id="EmailAssegnatario"
                type="email"
                placeholder="Email della persona che guida la macchina"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field id="secondaChiave" label="Seconda chiave">
              <Input
                id="secondaChiave"
                type="text"
                placeholder="Seconda chiave"
                value={secondaChiave}
                onChange={(e) => setSecondaChiave(e.target.value)}
              />
            </Field>
            <Field id="azienda" label="Intestata a (azienda)">
              <CompanySelect
                id="azienda"
                value={azienda}
                onChange={setAzienda}
              />
            </Field>
          </div>
          <Field id="note" label="Note">
            <Textarea
              id="note"
              placeholder="Note aggiuntive"
              value={note}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            {submitError && (
              <p className="mr-auto text-sm text-critical">{submitError}</p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={goBack}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              size="md"
              disabled={saving || !brand.trim() || !model.trim() || !targa.trim()}
            >
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>
      </div>

      <UnsavedChangesDialog
        open={confirmOpen}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </Page>
  );
}
