import { companies, findCompany } from "../../companyData/companies";
import Select from "./Select";

const chipClass =
  "inline-flex items-center gap-2 rounded-md border px-2.5 h-9 text-sm select-none cursor-pointer transition";

export default function CompanySelect({ id, value, onChange }) {
  const selected = findCompany(value);
  const unknownValue = value && !selected ? value : "";

  if (companies.length === 0) {
    return (
      <Select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seleziona...</option>
        {unknownValue ? <option value={unknownValue}>{unknownValue}</option> : null}
      </Select>
    );
  }

  return (
    <div id={id} className="flex flex-wrap items-center gap-2" role="group" aria-label="Azienda">
      <button
        type="button"
        className={`${chipClass} ${!value
            ? "border-brand bg-brand text-on-brand"
            : "border-border text-text hover:bg-bg-secondary"
          }`}
        onClick={() => onChange("")}
        aria-pressed={!value}
      >
        Nessuna
      </button>
      {unknownValue ? (
        <button
          type="button"
          className={`${chipClass} border-brand bg-brand text-on-brand`}
          onClick={() => onChange(unknownValue)}
          aria-pressed
        >
          {unknownValue}
        </button>
      ) : null}
      {companies.map((company) => {
        const isSelected = selected?.name === company.name;
        return (
          <button
            key={company.name}
            type="button"
            className={`${chipClass} ${isSelected
                ? "border-brand bg-brand text-on-brand"
                : "border-border text-text hover:bg-bg-secondary"
              }`}
            onClick={() => onChange(company.name)}
            aria-pressed={isSelected}
          >
            {company.logo ? (
              <img
                src={company.logo}
                alt=""
                className="h-5 w-5 object-contain rounded bg-white shrink-0"
              />
            ) : null}
            {company.name}
          </button>
        );
      })}
    </div>
  );
}
