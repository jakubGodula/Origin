<script lang="ts">
  import favicon from "$lib/assets/icon.svg";
  import { page } from "$app/state";
  import "../app.css";

  let { children } = $props();

  const links = [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Job Offers" },
    { href: "/applications", label: "My Applications" },
    { href: "/companies", label: "Companies" },
    { href: "/hr", label: "HR Panel" },
    { href: "/login", label: "Login" },
  ];
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div>
  <nav class="navbar">
    <div class="logo"><a href="/">JOB MARKETPLACE</a></div>

    <div class="nav-links">
      {#each links as link}
        <a
          href={link.href}
          class:active={link.href === "/"
            ? page.url.pathname === "/"
            : page.url.pathname.startsWith(link.href)}
        >
          {link.label}
        </a>
      {/each}
    </div>
  </nav>

  <main class="content">
    {@render children()}
  </main>
</div>
