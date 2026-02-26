<script lang="ts">
  import { organizations } from "$lib/stores/organizations";
</script>

<div class="container">
  <div class="header">
    <h2>Organizations</h2>
    <a href="/organizations/create" class="button">Create organization</a>
  </div>

  {#if $organizations.length === 0}
    <p>No organizations yet.</p>
  {:else}
    <ul>
      {#each $organizations as org}
        <li class="org-card">
          <a href={`/organizations/${org.id}`}>
            <strong>{org.name}</strong>
            <p>{org.branches.length} branch(es)</p>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
