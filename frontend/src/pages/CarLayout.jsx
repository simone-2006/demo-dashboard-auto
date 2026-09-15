import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, Plus, Table } from "lucide-react";

import Page from "../components/layout/Page";
import Button from "../components/ui/Button";
import Title from "../components/ui/Title";
import { rememberCarsList } from "../hooks/navigation";

const views = [
  { to: "/car", end: true, label: "Card", icon: LayoutGrid },
  { to: "/car/table", label: "Tabella", icon: Table },
];

export default function CarLayout() {
  const location = useLocation();

  useEffect(() => {
    rememberCarsList(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return (
    <Page>
      <Title
        left={
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-bold text-text text-xl">Tutte le macchine</h2>
            <nav
              aria-label="Vista elenco auto"
              className="flex items-center rounded-md border border-border bg-bg p-0.5"
            >
              {views.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-1 rounded-md px-2 py-0.5 text-sm transition-colors select-none",
                      isActive
                        ? "bg-brand text-on-brand"
                        : "text-text hover:bg-bg-secondary",
                    ].join(" ")
                  }
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        }
        right={
          <Link to="/addCar">
            <Button size="md">
              <div className="flex gap-1 items-center">
                <Plus size={14} />
                <p>AGGIUNGI MACCHINA</p>
              </div>
            </Button>
          </Link>
        }
      />
      <Outlet />
    </Page>
  );
}
