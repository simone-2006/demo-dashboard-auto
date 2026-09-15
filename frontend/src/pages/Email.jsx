import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import Title from "../components/ui/Title";
import SliderTempo from "../components/ui/SliderTempo";
import Button from "../components/ui/Button";
import UnsavedChangesDialog from "../components/ui/UnsavedChangesDialog";

import {
    getGiorniEmail,
    getEmailStatus,
    updateAdminImpostazioniEmail,
    updateProprietarioImpostazioniEmail,
    updateEmailStatus,
} from "../api/email";

import adminEmail from "../companyData/adminEmail.json"

import { toastSuccess, toastError } from "../hooks/toast";
import { peek } from "../api/cache";
import { useCachedResource } from "../hooks/useCachedResource";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

// Demo: la pagina resta visibile, ma non salva e non invia.
const DEMO_EMAIL_DISABLED = true;

// Tipi di avvisi configurabili
const AVVISI = [
    { id: "assicurazione", label: "Assicurazione" },
    { id: "bollo", label: "Bollo" },
    { id: "revisione", label: "Revisione" },
    { id: "tagliando", label: "Tagliando" }
];

function toBool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

export default function Email() {
    const cachedEmail = peek("email:giorni");
    const cachedStatus = peek("email:status");
    const { data: giorniEmail, setData: setGiorniEmail } = useCachedResource(
        "email:giorni",
        getGiorniEmail
    );
    const { data: emailStatusData, setData: setEmailStatusData } = useCachedResource(
        "email:status",
        getEmailStatus
    );

    const [adminAlert, setAdminAlert] = useState(
        cachedEmail?.admin ?? {
            assicurazione: 30,
            bollo: 30,
            revisione: 30,
            tagliando: 30,
        }
    );

    const [ownerAlert, setOwnerAlert] = useState(
        cachedEmail?.owner ?? {
            assicurazione: 15,
            bollo: 15,
            revisione: 15,
            tagliando: 15,
        }
    );

    const [adminChanged, setAdminChanged] = useState(false);
    const [ownerChanged, setOwnerChanged] = useState(false);

    const [emailActive, setEmailActive] = useState(() =>
        toBool(cachedStatus?.emailStatus ?? true)
    );

    const { confirmOpen, confirmLeave, cancelLeave } = useUnsavedChanges(
        {},
        { dirty: adminChanged || ownerChanged }
    );

    useEffect(() => {
        if (!giorniEmail) return;
        if (!adminChanged && giorniEmail.admin) setAdminAlert(giorniEmail.admin);
        if (!ownerChanged && giorniEmail.owner) setOwnerAlert(giorniEmail.owner);
        // solo quando arrivano dati dal server/cache, non quando spegni "changed"
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [giorniEmail]);

    useEffect(() => {
        if (!emailStatusData) return;
        setEmailActive(toBool(emailStatusData.emailStatus));
    }, [emailStatusData]);


    // Handler generico per aggiornare i valori
    const handleSliderChange = (section, key, value) => {
        if (DEMO_EMAIL_DISABLED) return;
        if (section === "admin") {
            setAdminChanged(true);
            setAdminAlert(prev => ({ ...prev, [key]: value }));
        } else if (section === "owner") {
            setOwnerChanged(true);
            setOwnerAlert(prev => ({ ...prev, [key]: value }));
        }
    };


    const saveAdminPreference = async () => {
        if (DEMO_EMAIL_DISABLED) return;
        try {
            const saved = await updateAdminImpostazioniEmail(adminAlert);
            setGiorniEmail(saved);
            setAdminChanged(false);
            toastSuccess("Preferenze email admin salvate con successo")
        } catch (error) {
            toastError("Errore nel salvataggio delle preferenze email admin");
        }
    }

    const saveOwnerPreference = async () => {
        if (DEMO_EMAIL_DISABLED) return;
        try {
            const saved = await updateProprietarioImpostazioniEmail(ownerAlert);
            setGiorniEmail(saved);
            setOwnerChanged(false);
            toastSuccess("Preferenze email proprietario salvate con successo")
        } catch (error) {
            toastError("Errore nel salvataggio delle preferenze email proprietario");
        }
    }

    const handleEmailToggle = async (checked) => {
        if (DEMO_EMAIL_DISABLED) return;
        const prev = emailActive;
        setEmailActive(checked);
        try {
            const saved = await updateEmailStatus(checked);
            setEmailStatusData(saved);
            toastSuccess(checked ? "Email attivate" : "Email disattivate");
        } catch (error) {
            setEmailActive(prev);
            toastError("Errore nel salvataggio dello stato email");
        }
    }

    return (
        <Page>
            {DEMO_EMAIL_DISABLED && (
                <div
                    role="status"
                    className="-mx-2 md:-mx-10 lg:-mx-38 mb-4 bg-warning/20 border-y border-warning/40 px-4 py-2.5 text-center text-sm font-medium text-text"
                >
                    Invio email disattivato in questa demo. La pagina è solo un&apos;anteprima.
                </div>
            )}
            <Title
                left={
                    <h2 className="font-bold text-text text-2xl tracking-tight">
                        Impostazioni Email
                    </h2>
                }
            ></Title>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 ${DEMO_EMAIL_DISABLED ? "pointer-events-none opacity-60" : ""}`}>
                {/* Admin Alerts Card */}
                <div className="bg-bg-secondary/90 p-5 rounded-lg border border-bg shadow-md">
                    <div className="flex flex-col justify-between mb-2">
                        <h2 className="font-bold text-lg text-primary">
                            Avviso ad amministratori
                        </h2>
                        <p className="text-xs text-secondary">
                            {adminEmail.map((email, idx) => (
                                <span key={idx}>
                                    {email}
                                    <br />
                                </span>
                            ))}
                        </p>

                    </div>
                    <div className="flex flex-col gap-6">
                        {AVVISI.map(avviso => (
                            <SliderTempo
                                key={`admin-${avviso.id}`}
                                id={`admin-${avviso.id}`}
                                label={avviso.label}
                                value={adminAlert[avviso.id]}
                                onChange={value => handleSliderChange("admin", avviso.id, value)}
                                valueLabel={`L’avviso per email arriverà ${adminAlert[avviso.id]} giorno${adminAlert[avviso.id] === 1 ? "" : "i"} prima della scadenza`}
                                min={0}
                                max={90}
                                className="py-2"
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-end">
                        <Button disabled={DEMO_EMAIL_DISABLED || !adminChanged} onClick={saveAdminPreference}>
                            Salva
                        </Button>
                    </div>
                </div>
                {/* Owner Alerts Card */}
                <div className="bg-bg-secondary/90 p-5 rounded-lg border border-bg shadow-md">
                    <div className="flex flex-col justify-between mb-2">
                        <h2 className="font-bold text-lg text-primary">
                            Avviso ai proprietari delle macchine
                        </h2>
                        <p className="text-xs text-secondary">Proprietari delle macchine</p>
                    </div>
                    <div className="flex flex-col gap-6">
                        {AVVISI.map(avviso => (
                            <SliderTempo
                                key={`owner-${avviso.id}`}
                                id={`owner-${avviso.id}`}
                                label={avviso.label}
                                value={ownerAlert[avviso.id]}
                                onChange={value => handleSliderChange("owner", avviso.id, value)}
                                valueLabel={`L’avviso per email arriverà ${ownerAlert[avviso.id]} giorno${ownerAlert[avviso.id] === 1 ? "" : "i"} prima della scadenza`}
                                min={0}
                                max={90}
                                className="py-2"
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-end">
                        <Button disabled={DEMO_EMAIL_DISABLED || !ownerChanged} onClick={saveOwnerPreference}>
                            Salva
                        </Button>
                    </div>
                </div>
            </div>
            <div className={`bg-bg-secondary/90 p-5 rounded-lg border border-bg shadow-md flex items-center justify-between ${DEMO_EMAIL_DISABLED ? "pointer-events-none opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                    <p className="text-text text-sm">Email:</p>
                    <label className={`relative ${DEMO_EMAIL_DISABLED ? "cursor-not-allowed" : "cursor-pointer"}`}>
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            onChange={e => handleEmailToggle(e.target.checked)}
                            checked={emailActive}
                            disabled={DEMO_EMAIL_DISABLED}
                        />
                        <div className="w-11 h-6 bg-bg-accent rounded-full peer peer-checked:bg-brand transition-colors duration-300 border-border border"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-bg rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                    </label>
                </div>
                {
                    emailActive ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success mr-2">
                            Email attive
                        </span>
                    ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-critical/20 text-critical">
                            Email non attive
                        </span>
                    )
                }
            </div>

            <UnsavedChangesDialog
                open={confirmOpen}
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
            />
        </Page>
    );
}
