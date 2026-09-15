import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Field from "../../../components/ui/Field";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import { getRevisione, updateRevisione } from "../../../api/revisioni";
import { gestisciScadenzePath } from "../scadenzeRoutes";
import { parseImporto } from "../../../hooks/function";
import BackButton from "../../../components/ui/BackButton";
import UnsavedChangesDialog from "../../../components/ui/UnsavedChangesDialog";
import { useGoBack } from "../../../hooks/navigation";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { toastError, toastSuccess } from "../../../hooks/toast";

import PageScadenze from "../layout/PageScadenze";

const ESITO_OPTIONS = ["Regolare", "Ripetere", "Sospeso"];

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

export default function ModificaRevisione() {
    const { id, revisioneId } = useParams();
    const outlet = useOutletContext() ?? {};
    const vehicleId = outlet.vehicleId ?? id;
    const listPath = gestisciScadenzePath(vehicleId, "revisione");
    const goBack = useGoBack(listPath);

    const [nome, setNome] = useState("");
    const [dataRevisione, setDataRevisione] = useState("");
    const [dataScadenza, setDataScadenza] = useState("");
    const [esito, setEsito] = useState("");
    const [importo, setImporto] = useState("");
    const [centroRevisione, setCentroRevisione] = useState("");
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
            dataRevisione,
            dataScadenza,
            esito,
            importo,
            centroRevisione,
            note,
        },
        { ready: !loading && !loadError }
    );

    const esitoOptions =
        esito && !ESITO_OPTIONS.includes(esito)
            ? [esito, ...ESITO_OPTIONS]
            : ESITO_OPTIONS;

    const isFormValid =
        Boolean(vehicleId) &&
        Boolean(revisioneId) &&
        Boolean(dataScadenza);

    function goToList() {
        goBack();
    }

    useEffect(() => {
        if (!revisioneId) {
            setLoading(false);
            setLoadError("Revisione non trovata");
            return;
        }

        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        getRevisione(revisioneId)
            .then((row) => {
                if (cancelled) return;
                const rowVehicleId = row?.Id_Veicolo ?? row?.Id_veicolo ?? row?.id_veicolo;
                if (
                    vehicleId != null &&
                    rowVehicleId != null &&
                    String(rowVehicleId) !== String(vehicleId)
                ) {
                    setLoadError("Questa revisione non appartiene al veicolo selezionato");
                    return;
                }
                setNome(row.nome ?? row.Nome ?? "");
                setDataRevisione(toDateInput(row.Data_revisione));
                setDataScadenza(toDateInput(row.Data_scadenza));
                setEsito(row.Esito ?? row.esito ?? "");
                setImporto(
                    row.Importo == null || row.Importo === ""
                        ? ""
                        : String(row.Importo)
                );
                setCentroRevisione(row.Centro_revisione ?? row.centro_revisione ?? "");
                setNote(row.Note ?? row.note ?? "");
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadError(err.message || "Errore durante il recupero della revisione");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [revisioneId, vehicleId]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isFormValid || saving) return;

        setSaving(true);
        setSubmitError(null);

        try {
            await updateRevisione(revisioneId, {
                Id_Veicolo: vehicleId,
                nome: nome.trim(),
                Data_revisione: dataRevisione,
                Data_scadenza: dataScadenza,
                Esito: esito.trim(),
                Importo: parseImporto(importo),
                Centro_revisione: centroRevisione.trim(),
                Note: note.trim(),
            });
            toastSuccess("Revisione modificata con successo");
            allowLeaveAnd(goBack);
        } catch (err) {
            setSubmitError(err.message || "Errore durante il salvataggio");
            toastError("Errore nella modifica della revisione");
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageScadenze>
            <div className="flex items-center gap-1 mb-2">
                <BackButton fallback={listPath} />
                <h2 className="font-bold text-text text-xl">Modifica revisione</h2>
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
                                placeholder="Es. Revisione 2026"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                autoComplete="off"
                                maxLength={50}
                            />
                        </Field>
                        <span className="hidden sm:block" />

                        <Field id="data_revisione" label="Data revisione">
                            <Input
                                id="data_revisione"
                                type="date"
                                value={dataRevisione}
                                onChange={(e) => setDataRevisione(e.target.value)}
                            />
                        </Field>

                        <Field id="data_scadenza" label="Data scadenza" required>
                            <Input
                                id="data_scadenza"
                                type="date"
                                min={dataRevisione || undefined}
                                value={dataScadenza}
                                onChange={(e) => setDataScadenza(e.target.value)}
                                required
                            />
                        </Field>

                        <Field id="esito" label="Esito" >
                            <Select
                                id="esito"
                                value={esito}
                                onChange={(e) => setEsito(e.target.value)}

                            >
                                <option value="">Seleziona...</option>
                                {esitoOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        <Field id="centro_revisione" label="Centro revisione">
                            <Input
                                id="centro_revisione"
                                type="text"
                                placeholder="Es. Centro revisioni"
                                value={centroRevisione}
                                onChange={(e) => setCentroRevisione(e.target.value)}
                                autoComplete="off"
                                maxLength={150}
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
                                    maxLength={500}
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
