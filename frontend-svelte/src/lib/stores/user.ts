import { writable } from "svelte/store";

export interface User {
  id: string;
  email: string;
}

const stored =
  typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;

export const currentUser = writable<User | null>(
  stored ? JSON.parse(stored) : null,
);

currentUser.subscribe((value) => {
  if (value) {
    localStorage.setItem("user", JSON.stringify(value));
  } else {
    localStorage.removeItem("user");
  }
});
