import { writable, type Writable } from "svelte/store";

export interface Branch {
  id: string;
  country: string;
  city: string;
  hrEmail: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  branches: Branch[];
  ownerId: string;
}

function createcompaniestore(): Writable<Company[]> {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("companies")
      : null;

  const initial: Company[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<Company[]>(initial);

  return {
    subscribe,
    set: (value: Company[]) => {
      localStorage.setItem("companies", JSON.stringify(value));
      set(value);
    },
    update: (updater: (current: Company[]) => Company[]) => {
      update((current) => {
        const updated = updater(current);
        localStorage.setItem("companies", JSON.stringify(updated));
        return updated;
      });
    },
  };
}

export const companies = createcompaniestore();
