import { NavLink, useParams } from "react-router-dom";
import { gestisciScadenzePath, scadenzeNavItems } from "../scadenzeRoutes";
import Button from "../../../components/ui/Button";

export default function NavbarScadenze() {
  const { id } = useParams();

  return (
    <nav
      aria-label="Tipo di scadenza"
      className="m flex flex-wrap items-center gap-1 border-b border-border pb-2"
    >
      {scadenzeNavItems.map((item) => (
        <NavLink
          key={item.slug}
          to={gestisciScadenzePath(id, item.slug)}
          replace
          className="select-none"
        >
          {({ isActive }) => (
            <Button
              variant={isActive ? "primary" : "ghost"}
              size="xs"
            // className="rounded-md px-2 py-0.5 transition-colors"
            >
              {item.title}
            </Button>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
