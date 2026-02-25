import { writable, type Writable } from "svelte/store";

export interface Branch {
  id: string;
  country: string;
  city: string;
  hrEmail: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  branches: Branch[];
}

function createOrganizationStore(): Writable<Organization[]> {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("organizations")
      : null;

  const initial: Organization[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<Organization[]>(initial);

  return {
    subscribe,
    set: (value: Organization[]) => {
      localStorage.setItem("organizations", JSON.stringify(value));
      set(value);
    },
    update: (updater: (current: Organization[]) => Organization[]) => {
      update((current) => {
        const updated = updater(current);
        localStorage.setItem("organizations", JSON.stringify(updated));
        return updated;
      });
    },
  };
}

export const organizations = createOrganizationStore();
