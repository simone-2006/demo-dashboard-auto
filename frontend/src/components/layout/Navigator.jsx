import { Link, useLocation, matchPath } from "react-router-dom";
import { getCarsListPath } from "../../hooks/navigation";

const SCADENZA_LABELS = {
    riepilogo: "Riepilogo",
    assicurazione: "Assicurazione",
    bollo: "Bollo",
    revisione: "Revisione",
    tagliando: "Tagliando",
};

function crumbTitle(navig) {
    return navig.title ?? navig.name ?? "";
}

function crumbsFromPathname(pathname) {
    if (pathname === "/" || pathname === "") {
        return [{ title: "Dashboard", to: "/" }];
    }

    if (pathname === "/settings") {
        return [{ title: "Impostazioni", to: "/settings" }];
    }

    if (pathname === "/email") {
        return [{ title: "Email", to: "/email" }];
    }

    const crumbs = [{ title: "Macchine", to: getCarsListPath() }];

    if (pathname === "/car" || pathname === "/car/table") return crumbs;

    if (pathname === "/addCar") {
        crumbs.push({ title: "Aggiungi", to: "/addCar" });
        return crumbs;
    }

    const carInfo = matchPath("/carInfo/:id", pathname);
    if (carInfo) {
        crumbs.push({ title: "Dettaglio", to: `/carInfo/${carInfo.params.id}` });
        return crumbs;
    }

    const editCar = matchPath("/editCar/:id", pathname);
    if (editCar) {
        crumbs.push({ title: "Dettaglio", to: `/carInfo/${editCar.params.id}` });
        crumbs.push({ title: "Modifica", to: `/editCar/${editCar.params.id}` });
        return crumbs;
    }

    const scadenze =
        matchPath("/gestisci-scadenze/:id/*", pathname) ||
        matchPath("/gestisci-scadenze/:id", pathname);

    if (scadenze) {
        const id = scadenze.params.id;
        crumbs.push({ title: "Dettaglio", to: `/carInfo/${id}` });
        crumbs.push({
            title: "Gestisci scadenze",
            to: `/gestisci-scadenze/${id}/riepilogo`,
        });

        const rest = (scadenze.params["*"] || "").split("/").filter(Boolean);
        const tipo = rest[0];
        const tipoLabel = SCADENZA_LABELS[tipo];

        if (tipoLabel) {
            crumbs.push({
                title: tipoLabel,
                to: `/gestisci-scadenze/${id}/${tipo}`,
            });
        }

        if (rest[1] === "aggiungi") {
            crumbs.push({
                title: "Aggiungi",
                to: `/gestisci-scadenze/${id}/${tipo}/aggiungi`,
            });
        } else if (rest[1] === "modifica") {
            crumbs.push({ title: "Modifica", to: pathname });
        }

        return crumbs;
    }

    return crumbs;
}

function CrumbLabel({ children, current }) {
    return (
        <span
            className={
                current
                    ? "text-text-muted hover:text-text transition-colors cursor-default"
                    : "text-text-light hover:text-text transition-colors"
            }
        >
            {children}
        </span>
    );
}

export default function Navigator({ navigElements }) {
    const { pathname } = useLocation();
    const items =
        navigElements?.length > 0 ? navigElements : crumbsFromPathname(pathname);

    if (!items.length) return null;

    return (
        <nav
            aria-label="Percorso"
            className="w-full px-2 md:px-10 lg:px-38 text-xs flex items-center gap-1 my-1"
        >
            {items.map((navig, idx) => {
                const isLast = idx === items.length - 1;
                const title = crumbTitle(navig);

                return (
                    <div key={`${navig.to || title}-${idx}`} className="flex gap-1 items-center">
                        {isLast || !navig.to ? (
                            <CrumbLabel current>{title}</CrumbLabel>
                        ) : (
                            <Link to={navig.to}>
                                <CrumbLabel>{title}</CrumbLabel>
                            </Link>
                        )}
                        {!isLast && <span className="text-text-muted">/</span>}
                    </div>
                );
            })}
        </nav>
    );
}
