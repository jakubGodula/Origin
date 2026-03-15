<script lang="ts">
  import { companies } from "$lib/stores/companies";
</script>

<div class="container">
  <div class="header">
    <h2>Companies</h2>
    <a href="/companies/create" class="button">Create Company</a>
  </div>

  {#if $companies.length === 0}
    <p>No Companies yet.</p>
  {:else}
    <ul>
      {#each $companies as org}
        <li class="org-card">
          <a href={`/companies/${org.id}`}>
            <strong>{org.name}</strong>
            <p>{org.branches.length} branch(es)</p>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  @media (max-width: 425px) {
    .header {
      flex-direction: column;
    }
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .org-card {
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .org-card:hover {
    background: #f5f5f5;
  }

  .org-card a {
    text-decoration: none;
    color: inherit;
    display: block;
  }
</style>
