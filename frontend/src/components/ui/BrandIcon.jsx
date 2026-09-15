import { Car } from "lucide-react";
import { Icon } from "@cardog-icons/react";

import { useTheme } from "../../context/themeContext.jsx";
import renaultLogo from "/logo-renault.png";
const ICON_BRANDS = new Set([
  "Acura",
  "AlfaRomeo",
  "AstonMartin",
  "Audi",
  "BMW",
  "BYD",
  "Bentley",
  "Bugatti",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "GMC",
  "Genesis",
  "Honda",
  "Hummer",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Koenigsegg",
  "Lamborghini",
  "Landrover",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Lucid",
  "MB",
  "Maserati",
  "Mazda",
  "Mclaren",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Pagani",
  "Polestar",
  "Porsche",
  "RAM",
  "Rivian",
  "RollsRoyce",
  "Subaru",
  "Tesla",
  "Toyota",
  "Vinfast",
  "Volkswagen",
  "Volvo",
]);

const BRAND_ALIASES = {
  "alfa romeo": "AlfaRomeo",
  "aston martin": "AstonMartin",
  "land rover": "Landrover",
  landrover: "Landrover",
  "mercedes-benz": "MB",
  "mercedes benz": "MB",
  mercedes: "MB",
  mb: "MB",
  "rolls-royce": "RollsRoyce",
  "rolls royce": "RollsRoyce",
  vw: "Volkswagen",
  volkswagen: "Volkswagen",
  vinfast: "Vinfast",
};

function toPascalCase(value) {
  return value
    .trim()
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function brandIconName(brand) {
  if (!brand?.trim()) return null;

  const lower = brand.trim().toLowerCase();
  const alias = BRAND_ALIASES[lower];
  if (alias && ICON_BRANDS.has(alias)) return `${alias}Icon`;

  const pascal = toPascalCase(brand);
  if (ICON_BRANDS.has(pascal)) return `${pascal}Icon`;

  const acronym = brand.trim().toUpperCase();
  if (ICON_BRANDS.has(acronym)) return `${acronym}Icon`;

  const match = [...ICON_BRANDS].find((item) => item.toLowerCase() === pascal.toLowerCase());
  return match ? `${match}Icon` : null;
}

export default function BrandIcon({ brand, size = 36, className = "shrink-0 text-text" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // hardcoded: la libreria non ha il logo Renault
  if (brand && brand.trim().toLowerCase() === "renault") {
    return (
      <img
        width={size}
        alt="Renault logo (2021-2024)"
        title="Renault logo"
        src={renaultLogo}
        className={isDark ? `${className} invert` : className}
      />
    );
  }

  const name = brandIconName(brand);
  if (!name) {
    return <Car size={size} className={className} />;
  }
  return <Icon name={isDark ? `${name}Dark` : name} size={size} className={className} />;
}
