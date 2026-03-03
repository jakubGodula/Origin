<script lang="ts">
  import { jobs } from "$lib/stores/jobs";
  import { organizations } from "$lib/stores/organizations";

  let title = "";
  let salary = "";
  let description = "";

  let organizationId = "";
  let branchId = "";

  let success = false;

  $: selectedOrganization = $organizations.find((o) => o.id === organizationId);

  function submitJob() {
    if (!title || !salary || !organizationId || !branchId) return;

    const newJob = {
      id: Date.now(),
      title,
      salary,
      description,
      organizationId,
      branchId,
    };

    jobs.update((current) => [...current, newJob]);

    success = true;

    title = "";
    salary = "";
    description = "";
    organizationId = "";
    branchId = "";

    setTimeout(() => {
      success = false;
    }, 3000);
  }
</script>

<div class="container">
  <h2>Post a Job</h2>

  <form on:submit|preventDefault={submitJob}>
    <div class="field">
      <input
        class="input"
        placeholder="Job title"
        bind:value={title}
        required
      />

      <input
        class="input"
        placeholder="Salary range"
        bind:value={salary}
        required
      />

      <textarea
        class="input"
        placeholder="Job description"
        rows="4"
        bind:value={description}
      ></textarea>
    </div>

    <h3>Select Organization</h3>

    <select class="input" bind:value={organizationId} required>
      <option value="">Select organization</option>
      {#each $organizations as org}
        <option value={org.id}>{org.name}</option>
      {/each}
    </select>

    {#if selectedOrganization}
      <h3>Select Branch</h3>

      <select class="input" bind:value={branchId} required>
        <option value="">Select branch</option>
        {#each selectedOrganization.branches as branch}
          <option value={branch.id}>
            {branch.country} — {branch.city}
          </option>
        {/each}
      </select>
    {/if}

    <button class="button" type="submit" style="margin-top:20px;">
      Post Job
    </button>
  </form>
</div>

{#if success}
  <div class="success">Job posted successfully!</div>
{/if}

<style>
  .field {
    display: grid;
    grid-template-columns: auto;
    gap: 12px;
  }
  .success {
    position: fixed;
    left: 50%;
    top: 70px;
    transform: translateX(-50%);
    border-radius: 10px;
    background: lightgreen;
    margin: auto;
    padding: 12px 20px;
    font-size: large;
    font-weight: bold;
  }
</style>
