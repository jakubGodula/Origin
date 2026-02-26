<script lang="ts">
  import { page } from "$app/stores";
  import { organizations } from "$lib/stores/organizations";

  $: orgId = $page.params.id;
  $: organization = $organizations.find((o) => o.id === orgId);
</script>

<div class="container">
  {#if !organization}
    <p>Organization not found.</p>
  {:else}
    <h2>{organization.name}</h2>
    <p>{organization.description}</p>

    <h3>Branches</h3>

    {#if organization.branches.length === 0}
      <p>No branches yet.</p>
    {:else}
      <ul>
        {#each organization.branches as branch}
          <li>
            {branch.country} — {branch.city}
            <br />
            HR: {branch.hrEmail}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
