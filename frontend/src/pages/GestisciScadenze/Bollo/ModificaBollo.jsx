import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Field from "../../../components/ui/Field";
import { getBollo, updateBollo } from "../../../api/bolli";
import { gestisciScadenzePath } from "../scadenzeRoutes";
import { parseImporto } from "../../../hooks/function";
import Textarea from "../../../components/ui/Textarea";
import BackButton from "../../../components/ui/BackButton";
import UnsavedChangesDialog from "../../../components/ui/UnsavedChangesDialog";
import { useGoBack } from "../../../hooks/navigation";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { toastError, toastSuccess } from "../../../hooks/toast";

import PageScadenze from "../layout/PageScadenze";

function toDateInput(value) {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function ModificaBollo() {
    const { id, bolloId } = useParams();
    const outlet = useOutletContext() ?? {};
    const vehicleId = outlet.vehicleId ?? id;
    const listPath = gestisciScadenzePath(vehicleId, "bollo");
    const goBack = useGoBack(listPath);

    const [nome, setNome] = useState("");
    const [inizioValidita, setInizioValidita] = useState("");
    const [fineValidita, setFineValidita] = useState("");
    const [scadenza, setScadenza] = useState("");
    const [importo, setImporto] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const {
        confirmOpen,
        confirmLeave,
        cancelLeave,
        allowLeaveAnd,
    } = useUnsavedChanges(
        {
            nome,
            inizioValidita,
            fineValidita,
            scadenza,
            importo,
            note,
        },
        { ready: !loading && !loadError }
    );

    const isFormValid =
        Boolean(vehicleId) &&
        Boolean(bolloId) &&
        Boolean(scadenza);

    function goToList() {
        goBack();
    }

    useEffect(() => {
        if (!bolloId) {
            setLoading(false);
            setLoadError("Bollo non trovato");
            return;
        }

        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        getBollo(bolloId)
            .then((row) => {
                if (cancelled) return;
                const rowVehicleId = row?.Id_veicolo ?? row?.id_veicolo;
                if (
                    vehicleId != null &&
                    rowVehicleId != null &&
                    String(rowVehicleId) !== String(vehicleId)
                ) {
                    setLoadError("Questo bollo non appartiene al veicolo selezionato");
                    return;
                }
                setNome(row.nome ?? row.Nome ?? "");
                setInizioValidita(toDateInput(row.inizio_validita ?? row.Inizio_validita));
                setFineValidita(toDateInput(row.fine_validita ?? row.Fine_validita));
                setScadenza(toDateInput(row.scadenza ?? row.Scadenza));
                setImporto(row.importo == null || row.importo === "" ? "" : String(row.importo));
                setNote(row.note ?? row.Note ?? "");
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadError(err.message || "Errore durante il recupero del bollo");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [bolloId, vehicleId]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isFormValid || saving) return;

        setSaving(true);
        setSubmitError(null);

        try {
            await updateBollo(bolloId, {
                Id_veicolo: vehicleId,
                nome: nome.trim(),
                inizio_validita: inizioValidita,
                fine_validita: fineValidita,
                scadenza,
                importo: parseImporto(importo),
                note: note.trim(),
            });
            toastSuccess("Bollo modificato con successo");
            allowLeaveAnd(goBack);
        } catch (err) {
            setSubmitError(err.message || "Errore durante il salvataggio");
            toastError("Errore nella modifica del bollo");
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageScadenze>
            <div className="flex items-center gap-1 mb-2">
                <BackButton fallback={listPath} />
                <h2 className="font-bold text-text text-xl">Modifica bollo</h2>
            </div>

            {loading ? (
                <div className="bg-bg rounded-md shadow-lg p-4 space-y-4 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                                <div className="h-4 w-24 rounded bg-bg-secondary" />
                                <div className="h-9 w-full rounded bg-bg-secondary" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : loadError ? (
                <div className="bg-bg rounded-md shadow-lg p-4">
                    <p className="font-medium text-text">{loadError}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                        Torna all&apos;elenco e riprova.
                    </p>
                    <Button type="button" size="md" className="mt-4" onClick={goToList}>
                        Torna all&apos;elenco
                    </Button>
                </div>
            ) : (
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
                                placeholder="Es. Bollo 2026"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                autoComplete="off"
                                maxLength={50}
                            />
                        </Field>
                        <span className="hidden sm:block" />

                        <Field id="inizio_validita" label="Inizio validità">
                            <Input
                                id="inizio_validita"
                                type="date"
                                value={inizioValidita}
                                onChange={(e) => setInizioValidita(e.target.value)}
                            />
                        </Field>

                        <Field id="fine_validita" label="Fine validità">
                            <Input
                                id="fine_validita"
                                type="date"
                                min={inizioValidita || undefined}
                                value={fineValidita}
                                onChange={(e) => setFineValidita(e.target.value)}
                            />
                        </Field>

                        <Field id="scadenza" label="Data scadenza" required>
                            <Input
                                id="scadenza"
                                type="date"
                                value={scadenza}
                                onChange={(e) => setScadenza(e.target.value)}
                                required
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
            )}

            <UnsavedChangesDialog
                open={confirmOpen}
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
            />
        </PageScadenze>
    );
}
