<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div>
  <nav class="navbar">
    <div class="logo"><a href="/">JOB MARKETPLACE</a></div>

    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/organizations">Organization</a>
      <a href="/jobs">Job Offers</a>
      <a href="/post-job">Post a Job</a>
    </div>
  </nav>

  <main class="content">
    {@render children()}
  </main>
</div>
