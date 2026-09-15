import { Outlet, useParams, Link } from "react-router-dom";
import Page from "../../components/layout/Page";
import Button from "../../components/ui/Button";
import NavbarScadenze from "./layout/NavbarScadenze";
import { getVehicle } from "../../api/vehicles";

import Title from "../../components/ui/Title";

import CarNameLogo from "../../components/ui/CarNameLogo";
import BackButton from "../../components/ui/BackButton";
import { getCarsListPath } from "../../hooks/navigation";
import { useCachedResource } from "../../hooks/useCachedResource";

export default function GestisciScadenze() {
  const { id } = useParams();
  const { data: carData, loading, error } = useCachedResource(
    id ? `vehicle:${id}` : null,
    () => getVehicle(id),
    Boolean(id)
  );

  return (
    <Page>
      {/* <div className="flex items-center justify-between bg-bg-secondary py-1 rounded-md">

        <div className="flex items-center gap-1 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate(id ? `/carInfo/${id}` : "/car")}
          >
            <ChevronLeft />
          </Button>
          <h2 className="font-bold text-text text-xl">Gestisci scadenze</h2>
        </div>
        <CarNameLogo macchina={carData} />

      </div> */}

      <Title
        left={
          <div className="flex items-center gap-1 min-w-0">
            <BackButton
              leaveScadenze
              vehicleId={id}
              fallback={id ? `/carInfo/${id}` : getCarsListPath()}
            />
            <h2 className="font-bold text-text text-xl">Gestisci scadenze</h2>
          </div>
        }
        right={
          <CarNameLogo macchina={carData} />
        }
      >

      </Title>

      {error || !carData ? (
        !loading ? (
          <div className="bg-bg rounded-md shadow-lg p-4 mt-3 text-center">
            <p className="font-medium text-text">{error?.message || "Veicolo non trovato"}</p>
            <Link to={getCarsListPath()} className="inline-block mt-4">
              <Button type="button" size="md">
                Torna alle macchine
              </Button>
            </Link>
          </div>
        ) : null
      ) : (
        <>
          <NavbarScadenze />
          <div className="mt-4">
            <Outlet context={{ vehicle: carData, vehicleId: id }} />
          </div>
        </>
      )}
    </Page>
  );
}
