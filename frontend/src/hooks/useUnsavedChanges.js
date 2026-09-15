import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";

function snapshotOf(values) {
  try {
    return JSON.stringify(values);
  } catch {
    return String(values);
  }
}

/**
 * Blocks in-app navigation when form values differ from the captured baseline.
 * Call allowLeaveAnd(fn) before leave after a successful save.
 *
 * @param {object} [values] - plain object of current form field values
 * @param {{ ready?: boolean, dirty?: boolean }} [options]
 *   - ready: when false (edit still loading), never dirty
 *   - dirty: optional override (e.g. page already tracks changed flags)
 */
export function useUnsavedChanges(values = {}, { ready = true, dirty } = {}) {
  const baselineRef = useRef(null);
  const bypassRef = useRef(false);
  const valuesRef = useRef(values);
  const [confirmOpen, setConfirmOpen] = useState(false);

  valuesRef.current = values;

  const snapshot = snapshotOf(values);
  const computedDirty =
    ready && baselineRef.current != null && snapshot !== baselineRef.current;
  const isDirty = dirty !== undefined ? Boolean(ready && dirty) : computedDirty;

  useEffect(() => {
    if (dirty !== undefined) return;
    if (!ready) {
      baselineRef.current = null;
      bypassRef.current = false;
      return;
    }
    baselineRef.current = snapshotOf(valuesRef.current);
    bypassRef.current = false;
  }, [ready, dirty]);

  useEffect(() => {
    if (isDirty) bypassRef.current = false;
  }, [isDirty, snapshot]);

  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }) => {
      if (bypassRef.current) return false;
      if (!isDirty) return false;
      return (
        currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search
      );
    },
    [isDirty]
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setConfirmOpen(true);
    } else {
      setConfirmOpen(false);
    }
  }, [blocker.state]);

  function allowLeave() {
    bypassRef.current = true;
    baselineRef.current = snapshotOf(valuesRef.current);
  }

  function allowLeaveAnd(leaveFn) {
    allowLeave();
    leaveFn?.();
  }

  function confirmLeave() {
    allowLeave();
    setConfirmOpen(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }

  function cancelLeave() {
    bypassRef.current = false;
    setConfirmOpen(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }

  return {
    isDirty,
    confirmOpen,
    confirmLeave,
    cancelLeave,
    allowLeave,
    allowLeaveAnd,
  };
}
