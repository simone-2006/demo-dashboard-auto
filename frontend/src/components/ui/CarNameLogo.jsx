import Targa from "./Targa";
import BrandIcon from "./BrandIcon";
import { Link } from "react-router-dom";

export default function CarNameLogo({ macchina }) {
    if (!macchina) {
        return (
            <div className="flex items-center gap-2 min-w-0 animate-pulse" aria-hidden="true">
                <div className="size-9 rounded-md bg-bg-secondary shrink-0" />
                <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-bg-secondary" />
                    <div className="h-4 w-24 rounded bg-bg-secondary" />
                </div>
            </div>
        );
    }

    const vehicleId = macchina.Id ?? macchina.id;
    const assegnazione = macchina.Assegnazione?.trim();

    let brand = "";
    let model = "";
    try {
        brand = (macchina.Brand ?? "").toUpperCase();
    } catch (e) {
        brand = "";
        console.error("Errore nel recupero del brand:", e);
    }
    try {
        model = (macchina.Modello ?? "").toUpperCase();
    } catch (e) {
        model = "";
        console.error("Errore nel recupero del modello:", e);
    }


    return (
        <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center p-2 bg-bg-secondary rounded-md">
                <BrandIcon brand={brand} size={36} />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* <Link to={vehicleId ? `/carInfo/${vehicleId}` : "/car"}> */}
                    <div className="flex items-center gap-1">
                        <h2 className="font-bold text-text text-xl">{brand}</h2>
                        <h2 className="font-semibold text-text text-xl">{model}</h2>
                    </div>
                    {/* </Link> */}
                    {macchina.Targa && <Targa targa={macchina.Targa} />}
                </div>
                {assegnazione ? (
                    <p className="text-text-secondary text-sm">{assegnazione}</p>
                ) : null}
            </div>
        </div>
    );
}
