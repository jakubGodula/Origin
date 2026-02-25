import { writable } from "svelte/store";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description?: string;
};

const storedJobs =
  typeof localStorage !== "undefined" ? localStorage.getItem("jobs") : null;

const initialJobs: Job[] = storedJobs ? JSON.parse(storedJobs) : [];

export const jobs = writable<Job[]>(initialJobs);

jobs.subscribe((value) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("jobs", JSON.stringify(value));
  }
});
