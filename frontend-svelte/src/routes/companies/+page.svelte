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
      {#each $companies as company}
        <li class="company-card">
          <a href={`/companies/${company.id}`}>
            <strong>{company.name}</strong>
            <p>{company.branches.length} branch(es)</p>
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
  .company-card {
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .company-card:hover {
    background: #f5f5f5;
  }

  .company-card a {
    text-decoration: none;
    color: inherit;
    display: block;
  }
</style>
