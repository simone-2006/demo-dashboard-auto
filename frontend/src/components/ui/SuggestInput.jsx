import { useEffect, useId, useRef, useState } from "react";
import Input from "./Input";

function highlightMatch(text, query) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  const end = index + query.length;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-text">{text.slice(index, end)}</span>
      {text.slice(end)}
    </>
  );
}

export default function SuggestInput({
  id,
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  minChars = 2,
  canSuggest = true,
  disabled = false,
  emptyMessage = "Nessun suggerimento",
  ...inputProps
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const pickedValueRef = useRef("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim();
  const showList = open && focused && canSuggest && !disabled;
  const optionId = (index) => `${listId}-option-${index}`;

  useEffect(() => {
    if (!focused || !canSuggest || disabled) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (query.length < minChars) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (pickedValueRef.current && query === pickedValueRef.current) {
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchSuggestions(query, controller.signal);
        if (controller.signal.aborted) return;
        setItems(Array.isArray(results) ? results : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (error) {
        if (error?.name === "AbortError") return;
        setItems([]);
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, focused, canSuggest, disabled, minChars, fetchSuggestions]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectItem(item) {
    pickedValueRef.current = item.label;
    onChange(item.label);
    onSelect?.(item);
    setOpen(false);
    setItems([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
    if (!showList) {
      if (event.key === "ArrowDown" && items.length) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        items.length ? (current + 1) % items.length : -1
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        items.length ? (current <= 0 ? items.length - 1 : current - 1) : -1
      );
    } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      selectItem(items[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Input
        {...inputProps}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => {
          if (event.target.value !== pickedValueRef.current) {
            pickedValueRef.current = "";
          }
          onChange(event.target.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget)) {
            setFocused(false);
            setOpen(false);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-bg py-1 shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
        >
          {loading && !items.length ? (
            <li className="px-2.5 py-2 text-sm text-text-muted">Ricerca...</li>
          ) : items.length ? (
            items.map((item, index) => (
              <li
                key={item.id ?? `${item.label}-${index}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-2.5 py-1.5 text-sm ${index === activeIndex
                  ? "bg-brand/10 text-text"
                  : "text-text hover:bg-bg-secondary"
                  }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(item)}
              >
                <span>{highlightMatch(item.label, query)}</span>
                {item.meta ? (
                  <span className="ml-2 text-xs text-text-muted">{item.meta}</span>
                ) : null}
              </li>
            ))
          ) : (
            <li className="px-2.5 py-2 text-sm text-text-muted">{emptyMessage}</li>
          )}
        </ul>
      )}
    </div>
  );
}
