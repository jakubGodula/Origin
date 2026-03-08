import { writable } from "svelte/store";

export interface Branch {
  id: number;
  name: string;
  organizationId: number;
}

export const branches = writable<Branch[]>([]);
