import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CARS_LIST_KEY = "nav:cars-list";
const SCADENZE_ORIGIN_KEY = "nav:scadenze-origin";

export function rememberCarsList(path) {
  try {
    sessionStorage.setItem(CARS_LIST_KEY, path);
  } catch {
    /* private mode / quota */
  }
}

export function getCarsListPath() {
  try {
    return sessionStorage.getItem(CARS_LIST_KEY) || "/car";
  } catch {
    return "/car";
  }
}

export function isScadenzePath(pathname) {
  return String(pathname || "").startsWith("/gestisci-scadenze");
}

function locationHref(location) {
  return `${location.pathname}${location.search || ""}`;
}

export function getScadenzeOrigin(vehicleId) {
  try {
    const saved = sessionStorage.getItem(SCADENZE_ORIGIN_KEY);
    if (saved) {
      const path = saved.split("?")[0];
      if (path && !isScadenzePath(path)) return saved;
    }
  } catch {
    /* private mode / quota */
  }
  if (vehicleId) return `/carInfo/${vehicleId}`;
  return getCarsListPath();
}

export function ScadenzeOriginTracker() {
  const location = useLocation();
  const prevRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = location;
    if (!prev) return;
    if (!isScadenzePath(prev.pathname) && isScadenzePath(location.pathname)) {
      try {
        sessionStorage.setItem(SCADENZE_ORIGIN_KEY, locationHref(prev));
      } catch {
        /* private mode / quota */
      }
    }
  }, [location]);

  return null;
}

export function useGoBack(fallback) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(fallback ?? getCarsListPath());
  }, [fallback, location.key, navigate]);
}

export function useLeaveScadenze(vehicleId) {
  const navigate = useNavigate();

  return useCallback(() => {
    navigate(getScadenzeOrigin(vehicleId), { replace: true });
  }, [navigate, vehicleId]);
}

export function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const fallback =
      typeof initialValue === "function" ? initialValue() : initialValue;
    if (!key) return fallback;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed == null) return fallback;
      if (
        fallback &&
        typeof fallback === "object" &&
        !Array.isArray(fallback) &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return { ...fallback, ...parsed };
      }
      return parsed;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (!key) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / quota */
    }
  }, [key, value]);

  return [value, setValue];
}
