import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useSessionState } from "../../hooks/navigation";

function normalizeColumn(col) {
  if (typeof col === "string") {
    return { header: col, accessor: col, filterable: true, sortable: true };
  }
  return {
    header: col.header ?? col.accessor,
    accessor: col.accessor ?? col.header,
    render: col.render,
    sortValue: col.sortValue,
    filterable: col.filterable !== false,
    sortable: col.sortable !== false,
  };
}

function cellText(row, col) {
  const value = row[col.accessor];
  if (value == null || typeof value === "object") return "";
  return String(value).toLowerCase();
}

function rawSortValue(row, col) {
  if (typeof col.sortValue === "function") {
    return col.sortValue(row[col.accessor], row);
  }
  const value = row[col.accessor];
  if (value == null || typeof value === "object") return null;
  return value;
}

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "it", {
    numeric: true,
    sensitivity: "base",
  });
}

function getFilterableColumns(cols, data) {
  return cols.filter((col) => {
    if (!col.filterable) return false;
    if (data.length === 0) return true;
    return data.some((row) => cellText(row, col) !== "");
  });
}

function getSortableAccessors(cols, data) {
  return new Set(
    cols
      .filter((col) => {
        if (!col.sortable) return false;
        if (data.length === 0) return true;
        return data.some((row) => rawSortValue(row, col) != null);
      })
      .map((col) => col.accessor)
  );
}

function SortIndicator({ direction }) {
  const className = "size-3.5 shrink-0";
  if (direction === "asc") {
    return <ArrowUp className={`${className} text-brand`} aria-hidden="true" />;
  }
  if (direction === "desc") {
    return <ArrowDown className={`${className} text-brand`} aria-hidden="true" />;
  }
  return (
    <ArrowUpDown
      className={`${className} text-text-muted opacity-40 group-hover:opacity-100`}
      aria-hidden="true"
    />
  );
}

const defaultTableUi = {
  column: "*",
  query: "",
  sort: { accessor: null, direction: "asc" },
};

export default function Table({
  columns = [],
  data = [],
  filterPlaceholder = "Cerca...",
  rowClassName,
  persistKey,
}) {
  const cols = columns.map(normalizeColumn);
  const filterableCols = getFilterableColumns(cols, data);
  const sortableAccessors = getSortableAccessors(cols, data);
  const [ui, setUi] = useSessionState(persistKey, () => ({
    column: "*",
    query: "",
    sort: { accessor: null, direction: "asc" },
  }));
  const column = ui?.column ?? "*";
  const query = ui?.query ?? "";
  const sort = ui?.sort ?? defaultTableUi.sort;

  function patchUi(updater) {
    setUi((prev) => {
      const base = prev && typeof prev === "object" ? prev : defaultTableUi;
      return typeof updater === "function" ? updater(base) : { ...base, ...updater };
    });
  }

  function setColumn(next) {
    patchUi({ column: next });
  }

  function setQuery(next) {
    patchUi({ query: next });
  }

  function setSort(next) {
    patchUi((prev) => ({
      ...prev,
      sort: typeof next === "function" ? next(prev.sort ?? defaultTableUi.sort) : next,
    }));
  }

  const columnNumber = cols.length;
  // console.log(columnNumber)

  const colPercentage = `${100 / columnNumber}%`;
  // console.log(colPercentage);

  const activeColumn = filterableCols.some((col) => col.accessor === column)
    ? column
    : "*";
  const q = query.trim().toLowerCase();
  const targetCols =
    activeColumn === "*"
      ? filterableCols
      : filterableCols.filter((col) => col.accessor === activeColumn);

  const filteredData = q
    ? data.filter((row) =>
      targetCols.some((col) => cellText(row, col).includes(q))
    )
    : data;

  const sortCol = cols.find((col) => col.accessor === sort.accessor);
  const displayedData =
    sortCol && sortableAccessors.has(sortCol.accessor)
      ? [...filteredData].sort((a, b) => {
        const cmp = compareValues(
          rawSortValue(a, sortCol),
          rawSortValue(b, sortCol)
        );
        return sort.direction === "asc" ? cmp : -cmp;
      })
      : filteredData;

  const selectedHeader = filterableCols.find(
    (col) => col.accessor === activeColumn
  )?.header;
  const placeholder =
    activeColumn === "*"
      ? filterPlaceholder
      : `Cerca in ${selectedHeader}...`;

  const emptyMessage =
    data.length === 0 ? "Nessun dato disponibile." : "Nessun risultato.";

  function toggleSort(accessor) {
    if (!sortableAccessors.has(accessor)) return;
    setSort((prev) => {
      if (prev.accessor !== accessor) {
        return { accessor, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { accessor, direction: "desc" };
      }
      return { accessor: null, direction: "asc" };
    });
  }

  return (
    <div className="rounded-lg border border-border">
      {data.length > 1 ?
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <select
            value={activeColumn}
            onChange={(e) => setColumn(e.target.value)}
            className="shrink-0 rounded-md border border-border bg-bg px-2 py-1 text-sm text-text outline-none"
            aria-label="Colonna da filtrare"
          >
            <option value="*">Tutte</option>
            {filterableCols.map((col) => (
              <option key={col.accessor} value={col.accessor}>
                {col.header}
              </option>
            ))}
          </select>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Search className="size-4 shrink-0 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
        :
        ""
      }

      <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 15rem)" }}>

        <table className="min-w-full bg-bg divide-y divide-border table-fixed">
          <thead className="sticky top-0">
            <tr>
              {cols.map((col) => {
                const isSortable = sortableAccessors.has(col.accessor);
                const isActive = sort.accessor === col.accessor;
                const ariaSort = !isSortable
                  ? undefined
                  : isActive
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";

                return (
                  <th
                    key={col.accessor}
                    scope="col"
                    aria-sort={ariaSort}
                    className="px-4 py-2 text-left text-xs font-medium text-text uppercase tracking-wider bg-bg-secondary"
                    style={{ width: colPercentage }}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.accessor)}
                        className="group inline-flex items-center gap-1 rounded px-0.5 -mx-0.5 uppercase tracking-wider hover:text-text"
                        aria-label={`Ordina per ${col.header}`}
                      >
                        {col.header}
                        <SortIndicator
                          direction={isActive ? sort.direction : null}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedData.length === 0 ? (
              <tr className="hover:bg-brand/10">
                <td
                  colSpan={cols.length || 1}
                  className="px-4 py-4 text-center text-text"
                  style={{ width: colPercentage }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayedData.map((row, idx) => {
                const highlight =
                  typeof rowClassName === "function"
                    ? rowClassName(row)
                    : rowClassName;
                return (
                  <tr key={row.Id ?? row.id ?? idx} className={`hover:bg-brand/10 ${highlight}`} >
                    {cols.map((col) => (
                      <td
                        key={col.accessor}
                        style={{ width: colPercentage }}
                        className={["px-4 py-2 text-sm text-text-secondary", highlight]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {col.render
                          ? col.render(row[col.accessor], row)
                          : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export function TableSkeleton({ columns = [], rows = 4 }) {
  const cols = columns.map(normalizeColumn);
  const columnNumber = Math.max(cols.length, 1);
  const colPercentage = `${100 / columnNumber}%`;
  const rowList = Array.isArray(rows)
    ? rows
    : Array.from({ length: rows }, () => ({}));

  const barWidth = [
    "w-24",
    "w-20",
    "w-16",
    "w-[4.5rem]",
    "w-28",
    "w-14",
  ];

  return (
    <div className="rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-bg divide-y divide-border table-fixed">
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.accessor}
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-text uppercase tracking-wider bg-bg-secondary"
                  style={{ width: colPercentage }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rowList.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {cols.map((col, colIdx) => {
                  const known = row?.[col.accessor];
                  const isBadge = col.accessor === "stato";
                  return (
                    <td
                      key={col.accessor}
                      className="px-4 py-2 text-sm text-text-secondary"
                      style={{ width: colPercentage }}
                    >
                      {known != null && known !== "" ? (
                        known
                      ) : (
                        <div
                          className={[
                            "bg-border animate-pulse",
                            isBadge
                              ? "h-5 w-16 rounded-full"
                              : `h-4 max-w-full rounded ${barWidth[(rowIdx + colIdx) % barWidth.length]}`,
                          ].join(" ")}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}