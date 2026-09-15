import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "nav:scroll";

function readMap() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode / quota */
  }
}

function save(key, y) {
  const map = readMap();
  map[key] = y;
  writeMap(map);
}

export default function ScrollRestoration() {
  const { key } = useLocation();

  useLayoutEffect(() => {
    const saved = readMap()[key];
    const target = typeof saved === "number" ? saved : 0;
    const apply = () => window.scrollTo(0, target);
    apply();

    const frame = window.requestAnimationFrame(apply);
    const later = window.setTimeout(apply, 150);
    const afterLoad = window.setTimeout(apply, 500);

    const onScroll = () => save(key, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onScroll);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
      window.clearTimeout(afterLoad);
      save(key, window.scrollY);
    };
  }, [key]);

  return null;
}
