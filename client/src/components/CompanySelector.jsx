import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { api } from "../services/api";

const DROPDOWN_LIMIT = 15;
const DEBOUNCE_MS = 300;

const logoPlaceholder = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Company")}&background=6366f1&color=fff&size=48`;

function CompanyOption({ company, isHighlighted, onClick }) {
  const name = company.company_name ?? company.name ?? "";
  const logo = company.logo_url ?? company.logo ?? null;

  return (
    <button
      type="button"
      onClick={() => onClick(company)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
        isHighlighted
          ? "bg-indigo-50 text-indigo-900"
          : "hover:bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.src = logoPlaceholder(name);
            }}
          />
        ) : (
          <img
            src={logoPlaceholder(name)}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <span className="font-medium truncate">{name}</span>
      {(company.industry ?? company.description) && (
        <span className="ml-auto text-sm text-gray-500 truncate max-w-[40%]">
          {company.industry ?? company.description}
        </span>
      )}
    </button>
  );
}

export default function CompanySelector({
  value,
  onChange,
  placeholder = "Search or select a company",
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const cacheRef = useRef(new Map());
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const fetchCompanies = useCallback(async (search) => {
    const key = (search || "").toLowerCase().trim();
    const cached = cacheRef.current.get(key);
    if (cached) {
      setOptions(cached);
      return;
    }
    setLoading(true);
    try {
      const companies = await api.companiesSearch(search, DROPDOWN_LIMIT);
      setOptions(companies);
      cacheRef.current = new Map(cacheRef.current).set(key, companies);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchCompanies(debouncedQuery);
  }, [open, debouncedQuery, fetchCompanies]);

  useEffect(() => {
    if (!open) return;
    setHighlightIndex(options.length > 0 ? 0 : -1);
  }, [open, options]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || highlightIndex < 0) return;
    listRef.current?.children[highlightIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [open, highlightIndex]);

  const handleSelect = useCallback(
    (company) => {
      onChange(company);
      setQuery("");
      setOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setHighlightIndex(-1);
        inputRef.current?.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < options.length - 1 ? i + 1 : i));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
        return;
      }
      if (e.key === "Enter" && highlightIndex >= 0 && options[highlightIndex]) {
        e.preventDefault();
        handleSelect(options[highlightIndex]);
      }
    },
    [open, options, highlightIndex, handleSelect],
  );

  const displayName = value ? (value.company_name ?? value.name ?? "") : "";
  const showDropdown =
    open &&
    (loading || options.length > 0 || (debouncedQuery.trim() && !loading));

  return (
    <div ref={containerRef} className="relative w-full">
      {value ? (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden flex-shrink-0">
              {(value.logo_url ?? value.logo) ? (
                <img
                  src={value.logo_url ?? value.logo}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = logoPlaceholder(displayName);
                  }}
                />
              ) : (
                <img
                  src={logoPlaceholder(displayName)}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <span className="font-medium text-gray-900">{displayName}</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 p-1 rounded hover:bg-indigo-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              aria-label="Clear selection"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
          >
            Change company
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              aria-label={placeholder}
            />
            {loading && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-hidden
              >
                <svg
                  className="animate-spin h-5 w-5 text-indigo-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          {showDropdown && (
            <ul
              ref={listRef}
              role="listbox"
              className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
            >
              {loading && options.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">Searching…</li>
              ) : options.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">
                  No companies found
                </li>
              ) : (
                options.map((company, i) => (
                  <li
                    key={company.company_id ?? company.id ?? i}
                    role="option"
                    aria-selected={i === highlightIndex}
                  >
                    <CompanyOption
                      company={company}
                      isHighlighted={i === highlightIndex}
                      onClick={handleSelect}
                    />
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
