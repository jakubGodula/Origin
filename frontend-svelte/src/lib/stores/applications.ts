import { writable } from "svelte/store";

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "accepted"
  | "rejected";

export interface Application {
  jobId: number;
  appliedAt: number;
  status: ApplicationStatus;
}
const stored =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("applications")
    : null;

const initial: Application[] = stored ? JSON.parse(stored) : [];

export const applications = writable<Application[]>(initial);

applications.subscribe((value) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("applications", JSON.stringify(value));
  }
});
