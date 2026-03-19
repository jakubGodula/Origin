import { writable } from "svelte/store";

export interface Job {
  id: number;
  title: string;
  salary: string;
  description: string;
  companyId: string;
  branchId: string;
  ownerId: string;
}

function createJobStore() {
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("jobs") : null;

  const initial = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<Job[]>(initial);

  return {
    subscribe,
    set,
    update: (callback: (value: Job[]) => Job[]) =>
      update((current) => {
        const updated = callback(current);
        localStorage.setItem("jobs", JSON.stringify(updated));
        return updated;
      }),
  };
}

export const jobs = createJobStore();
