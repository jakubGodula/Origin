<script lang="ts">
  import { organizations } from "$lib/stores/organizations";
  import { goto } from "$app/navigation";

  let name = "";
  let description = "";
  let country = "";
  let city = "";
  let hrEmail = "";

  let successMessage = "";

  function createOrganization() {
    if (!name || !country || !city || !hrEmail) return;

    const newOrg = {
      id: crypto.randomUUID(),
      name,
      description,
      branches: [
        {
          id: crypto.randomUUID(),
          country,
          city,
          hrEmail,
        },
      ],
    };

    organizations.update((current) => [...current, newOrg]);

    successMessage = "Organization created successfully!";

    name = "";
    description = "";
    country = "";
    city = "";
    hrEmail = "";

    setTimeout(() => {
      successMessage = "";
      goto("/organization");
    }, 1500);
  }
</script>

<div class="container">
  <h2>Create Organization</h2>

  <form on:submit|preventDefault={createOrganization}>
    <input
      class="input"
      placeholder="Organization name"
      bind:value={name}
      required
    />
    <input class="input" placeholder="Description" bind:value={description} />
    <input class="input" placeholder="Country" bind:value={country} required />
    <input class="input" placeholder="City" bind:value={city} required />
    <input
      class="input"
      placeholder="HR email"
      type="email"
      bind:value={hrEmail}
      required
    />

    <button class="button" type="submit">Create</button>
  </form>

  {#if successMessage}
    <div class="success">{successMessage}</div>
  {/if}
</div>
