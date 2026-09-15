import { useParams } from "react-router-dom";
import ScadenzeAuto from "../../components/ui/ScadenzeAuto";
import { getVehicle } from "../../api/vehicles";
import { useCachedResource } from "../../hooks/useCachedResource";
import PageScadenze from "./layout/PageScadenze";

export default function Riepilogo() {
    const { id } = useParams();
    const { data: carData } = useCachedResource(
        id ? `vehicle:${id}` : null,
        () => getVehicle(id),
        Boolean(id)
    );
    return (
        <PageScadenze>
            <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-text text-xl">Riepilogo</h2>
            </div>
            <ScadenzeAuto macchina={carData}

            ></ScadenzeAuto>
        </PageScadenze>
    );
}