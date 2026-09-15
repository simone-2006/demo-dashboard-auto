import Button from "../ui/Button";
import { Link, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { getCarsListPath } from "../../hooks/navigation";

const navBarButtons = [
    {
        title: "Dashboard",
        to: "/",
        match: ["/"],
    },
    {
        title: "Macchine",
        to: "/car",
        match: ["/car", "/carInfo", "/addCar", "/editCar", "/gestisci-scadenze"],
    },
    {
        title: "Email",
        to: "/email",
        match: ["/email"],
    },
];

function pathMatches(pathname, prefix) {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function Navbar() {
    const { pathname } = useLocation();
    // console.log(pathname)

    function isActive(button) {
        return button.match.some((prefix) => pathMatches(pathname, prefix));
    }

    return (
        <div className="w-full px-2 py-1 flex items-center justify-between bg-bg-secondary shadow-xs">
            <div className="flex items-center gap-1">
                {navBarButtons.map((button) => (
                    <Link
                        key={button.title}
                        to={button.title === "Macchine" ? getCarsListPath() : button.to}
                    >
                        <Button variant={isActive(button) ? "primary" : "ghost"} size={"md"}>
                            {button.title}
                        </Button>
                    </Link>
                ))}
            </div>
            <div className="flex items-center gap-2">
                {/* <p className="font-semibold text-sm select-none text-text">GESTIONE SCADENZE AUTO</p> */}
                <Link to="/settings">
                    <Button variant={pathname === "/settings" ? "primary" : "ghost"} size={"md"}>
                        <Settings size={16} ></Settings>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
