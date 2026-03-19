<script lang="ts">
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";
  import { currentUser } from "$lib/stores/user";

  let title = "";
  let salary = "";
  let description = "";
  let companyId = "";
  let branchId = "";

  let success = false;

  $: selectedCompany = $companies.find((o) => o.id === companyId);

  function submitJob() {
    if (!title || !salary || !companyId || !branchId) return;

    const user = $currentUser;

    if (!user) return;

    const newJob = {
      id: Date.now(),
      title,
      salary,
      description,
      companyId,
      branchId,
      ownerId: user.id,
    };

    jobs.update((current) => [...current, newJob]);

    success = true;

    title = "";
    salary = "";
    description = "";
    companyId = "";
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

    <h3>Select Company</h3>

    <select class="input" bind:value={companyId} required>
      <option value="">Select Company</option>
      {#each $companies as company}
        <option value={company.id}>{company.name}</option>
      {/each}
    </select>

    {#if selectedCompany}
      <h3>Select Branch</h3>

      <select class="input" bind:value={branchId} required>
        <option value="">Select branch</option>
        {#each selectedCompany.branches as branch}
          <option value={branch.id}>
            {branch.country} — {branch.city}
          </option>
        {/each}
      </select>
    {/if}

    <button class="button" type="submit" disabled={!$currentUser}>
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
