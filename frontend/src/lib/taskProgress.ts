const STORAGE_KEY = "afterversed.taskProgress.segments";
export const TASK_PROGRESS_EVENT = "afterversed:taskProgressUpdated";

export type TaskProgressDetail = {
  count: number;
};

const parseCount = (value: string | null): number => {
  if (typeof value !== "string") {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export const getStoredTaskProgress = (): number => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return 0;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return parseCount(raw);
};

export const setStoredTaskProgress = (count: number): number => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return 0;
  }
  const sanitized = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  window.localStorage.setItem(STORAGE_KEY, String(sanitized));
  window.dispatchEvent(
    new CustomEvent<TaskProgressDetail>(TASK_PROGRESS_EVENT, {
      detail: { count: sanitized },
    }),
  );
  return sanitized;
};

export const subscribeToTaskProgress = (listener: (count: number) => void): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<TaskProgressDetail>;
    const next = customEvent.detail?.count;
    if (typeof next === "number" && Number.isFinite(next)) {
      listener(next);
    }
  };

  window.addEventListener(TASK_PROGRESS_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(TASK_PROGRESS_EVENT, handler as EventListener);
  };
};

export const STORAGE = {
  key: STORAGE_KEY,
  parseCount,
};
