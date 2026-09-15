import { findCompany } from "../../companyData/companies";

export default function CompanyBadge({ name, className = "" }) {
  const company = findCompany(name);
  const label = (company?.name || name || "").toUpperCase().trim();
  return (
    <span className={`bg-bg-secondary inline-flex items-center gap-2 min-w-0 px-2 rounded-md select-none h-8 ${className}`.trim()}
      title={company?.name || name}
    >
      {company?.logo && (
        <img
          src={company.logo}
          alt=""
          className="h-6 w-6 object-contain rounded shrink-0"
        />
      )}
      <span className={`text-xs ${label ? "text-text truncate" : "text-text-muted"}`}>
        {label || "—"}
      </span>
    </span>
  );
}
