import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Field from "../../../components/ui/Field";
import Textarea from "../../../components/ui/Textarea";
import { addTagliando } from "../../../api/tagliandi";
import { gestisciScadenzePath } from "../scadenzeRoutes";
import { parseImporto } from "../../../hooks/function";
import BackButton from "../../../components/ui/BackButton";
import UnsavedChangesDialog from "../../../components/ui/UnsavedChangesDialog";
import { useGoBack } from "../../../hooks/navigation";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { toastError, toastSuccess } from "../../../hooks/toast";

import PageScadenze from "../layout/PageScadenze";

export default function AggiungiTagliando() {
  const { id } = useParams();
  const outlet = useOutletContext() ?? {};
  const vehicleId = outlet.vehicleId ?? id;
  const listPath = gestisciScadenzePath(vehicleId, "tagliando");
  const goBack = useGoBack(listPath);

  const [nome, setNome] = useState("");
  const [dataTagliando, setDataTagliando] = useState("");
  const [dataScadenza, setDataScadenza] = useState("");
  const [scadenzaKm, setScadenzaKm] = useState("");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    confirmOpen,
    confirmLeave,
    cancelLeave,
    allowLeaveAnd,
  } = useUnsavedChanges({
    nome,
    dataTagliando,
    dataScadenza,
    scadenzaKm,
    importo,
    note,
  });

  const isFormValid = Boolean(vehicleId) && Boolean(dataScadenza);

  function goToList() {
    goBack();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid || saving) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await addTagliando({
        Id_veicolo: vehicleId,
        nome: nome.trim(),
        Data_tagliando: dataTagliando,
        data_scadenza: dataScadenza,
        scadenza_km: scadenzaKm.trim(),
        importo: parseImporto(importo),
        note: note.trim(),
      });
      toastSuccess("Tagliando aggiunto con successo");
      allowLeaveAnd(goBack);
    } catch (err) {
      setSubmitError(err.message || "Errore durante il salvataggio");
      toastError("Errore nell'inserimento del tagliando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageScadenze>
      <div className="flex items-center gap-1 mb-2">
        <BackButton fallback={listPath} />
        <h2 className="font-bold text-text text-xl">Aggiungi tagliando</h2>
      </div>

      <form
        className="bg-bg rounded-md shadow-lg p-4 space-y-4"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="nome" label="Nome">
            <Input
              id="nome"
              type="text"
              placeholder="Es. Tagliando 2026"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="off"
              maxLength={50}
            />
          </Field>
          <span className="hidden sm:block" />

          <Field id="data_tagliando" label="Data tagliando">
            <Input
              id="data_tagliando"
              type="date"
              value={dataTagliando}
              onChange={(e) => setDataTagliando(e.target.value)}
            />
          </Field>

          <Field id="data_scadenza" label="Data scadenza" required>
            <Input
              id="data_scadenza"
              type="date"
              min={dataTagliando || undefined}
              value={dataScadenza}
              onChange={(e) => setDataScadenza(e.target.value)}
              required
            />
          </Field>

          <Field
            id="scadenza_km"
            label="Scadenza km"
            hint="Chilometraggio a cui va rifatto il tagliando"
          >
            <Input
              id="scadenza_km"
              type="number"
              value={scadenzaKm}
              min="0"
              step="1000"
              placeholder="Es. 15000"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) setScadenzaKm(val);
              }}
            />
          </Field>

          <Field id="importo" label="Importo">
            <Input
              id="importo"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={importo}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) setImporto(val);
              }}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="note" label="Note aggiuntive">
              <Textarea
                id="note"
                placeholder="Note aggiuntive"
                value={note}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          {submitError ? (
            <p className="mr-auto text-sm text-critical">{submitError}</p>
          ) : null}
          <Button type="button" variant="ghost" size="md" onClick={goToList} disabled={saving}>
            Annulla
          </Button>
          <Button type="submit" size="md" disabled={saving || !isFormValid}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </form>

      <UnsavedChangesDialog
        open={confirmOpen}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </PageScadenze>
  );
}
