import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { addAssicurazione } from "../../../api/assicurazioni";
import { gestisciScadenzePath } from "../scadenzeRoutes";
import { parseImporto } from "../../../hooks/function";

import Field from "../../../components/ui/Field";
import Textarea from "../../../components/ui/Textarea";
import BackButton from "../../../components/ui/BackButton";
import UnsavedChangesDialog from "../../../components/ui/UnsavedChangesDialog";
import { useGoBack } from "../../../hooks/navigation";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { toastError, toastSuccess } from "../../../hooks/toast";

import PageScadenze from "../layout/PageScadenze";

export default function AggiungiAssicurazione() {
    const { id } = useParams();
    const outlet = useOutletContext() ?? {};
    const vehicleId = outlet.vehicleId ?? id;
    const listPath = gestisciScadenzePath(vehicleId, "assicurazione");
    const goBack = useGoBack(listPath);

    const [nome, setNome] = useState("");
    const [compagnia, setCompagnia] = useState("");
    const [numeroPolizza, setNumeroPolizza] = useState("");
    const [classeDiMerito, setClasseDiMerito] = useState("");
    const [dataPagamento, setDataPagamento] = useState("");
    const [dataScadenza, setDataScadenza] = useState("");
    const [periodoTolleranza, setPeriodoTolleranza] = useState("15");
    const [importo, setImporto] = useState("");
    const [note, setNote] = useState("")

    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const {
        confirmOpen,
        confirmLeave,
        cancelLeave,
        allowLeaveAnd,
    } = useUnsavedChanges({
        nome,
        compagnia,
        numeroPolizza,
        classeDiMerito,
        dataPagamento,
        dataScadenza,
        periodoTolleranza,
        importo,
        note,
    });

    const tolleranzaNum = Number(periodoTolleranza);
    const isFormValid =
        Boolean(vehicleId) &&
        Boolean(dataScadenza) &&
        (periodoTolleranza === "" || (Number.isFinite(tolleranzaNum) && tolleranzaNum >= 0));

    function goToList() {
        goBack();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isFormValid || saving) return;

        setSaving(true);
        setSubmitError(null);

        try {
            await addAssicurazione({
                Id_veicolo: vehicleId,
                nome: nome.trim(),
                Compagnia: compagnia.trim(),
                Numero_polizza: numeroPolizza.trim(),
                ClasseDiMerito: classeDiMerito.trim(),
                Data_ultimo_pagamento: dataPagamento,
                Data_scadenza: dataScadenza,
                Periodo_di_tolleranza: periodoTolleranza === "" ? null : tolleranzaNum,
                Importo: parseImporto(importo),
                note: note.trim(),
            });
            toastSuccess("Assicurazione aggiunta con successo");
            allowLeaveAnd(goBack);
        } catch (err) {
            setSubmitError(err.message || "Errore durante il salvataggio");
            toastError("Errore nell'inserimento dell'assicurazione");
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageScadenze>
            <div className="flex items-center gap-1 mb-2">
                <BackButton fallback={listPath} />
                <h2 className="font-bold text-text text-xl">Aggiungi assicurazione</h2>
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
                            placeholder="Es. Kasko"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            autoComplete="off"
                            maxLength={50}
                        />
                    </Field>

                    <Field id="compagnia" label="Compagnia">
                        <Input
                            id="compagnia"
                            type="text"
                            placeholder="Compagnia assicurativa"
                            value={compagnia}
                            onChange={(e) => setCompagnia(e.target.value)}
                            autoComplete="off"
                            maxLength={50}
                        />
                    </Field>

                    <Field id="numero_polizza" label="Numero polizza">
                        <Input
                            id="numero_polizza"
                            type="text"
                            placeholder="Numero identificativo polizza"
                            value={numeroPolizza}
                            onChange={(e) => setNumeroPolizza(e.target.value)}
                            autoComplete="off"
                            maxLength={50}
                        />
                    </Field>

                    <Field id="classe_di_merito" label="Classe di merito">
                        <Input
                            id="classe_di_merito"
                            type="text"
                            placeholder="Es. 1, 14, CU"
                            value={classeDiMerito}
                            onChange={(e) => setClasseDiMerito(e.target.value)}
                            autoComplete="off"
                            maxLength={50}
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

                    <Field id="periodo_tolleranza" label="Periodo di tolleranza (giorni)">
                        <Input
                            id="periodo_tolleranza"
                            type="number"
                            min="0"
                            value={periodoTolleranza}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0)) {
                                    setPeriodoTolleranza(val);
                                }
                            }}
                        />
                    </Field>

                    <Field id="data_pagamento" label="Data inizio copertura">
                        <Input
                            id="data_pagamento"
                            type="date"
                            value={dataPagamento}
                            onChange={(e) => setDataPagamento(e.target.value)}
                        />
                    </Field>

                    <Field id="data_scadenza" label="Data scadenza" required>
                        <Input
                            id="data_scadenza"
                            type="date"
                            value={dataScadenza}
                            onChange={(e) => setDataScadenza(e.target.value)}
                            required
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
