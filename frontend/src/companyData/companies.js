import companiesJson from "./company.json";

const logoModules = import.meta.glob("./logos/*.{png,jpg,jpeg,svg,webp}", {
  eager: true,
  import: "default",
});

function resolveLogo(logoPath) {
  if (!logoPath) return null;
  const filename = String(logoPath).replace(/\\/g, "/").split("/").pop();
  if (!filename) return null;
  const entry = Object.entries(logoModules).find(([path]) =>
    path.replace(/\\/g, "/").endsWith(`/${filename}`)
  );
  return entry ? entry[1] : null;
}

export const companies = (Array.isArray(companiesJson) ? companiesJson : [])
  .filter((company) => company?.name?.trim())
  .map((company) => ({
    name: company.name.trim(),
    sigla: company.sigla?.trim() || null,
    logo: resolveLogo(company.logoPath || company.logo),
  }));

export function findCompany(value) {
  if (!value || typeof value !== "string") return null;
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    companies.find(
      (company) =>
        company.name.toLowerCase() === needle ||
        company.sigla?.toLowerCase() === needle
    ) ?? null
  );
}
