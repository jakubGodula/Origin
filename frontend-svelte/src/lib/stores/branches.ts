import { writable } from "svelte/store";

export interface Branch {
  id: number;
  name: string;
  companyId: number;
}

export const branches = writable<Branch[]>([]);
