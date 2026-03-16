<script lang="ts">
  import { page } from "$app/stores";
  import { companies } from "$lib/stores/companies";
  import type { Company } from "$lib/stores/companies";
  import { jobs } from "$lib/stores/jobs";
  import type { Job } from "$lib/stores/jobs";

  let company: Company | undefined;

  $: {
    const id = $page.params.id;
    company = $companies.find((o) => o.id === id);
  }

  let companyJobs: Job[] = [];

  $: {
    if (company) {
      const companyId = company.id;

      companyJobs = $jobs.filter((job) => job.companyId === companyId);
    } else {
      companyJobs = [];
    }
  }

  let country = "";
  let city = "";
  let hrEmail = "";

  function addBranch() {
    if (!company || !country || !city || !hrEmail) return;

    companies.update((firms) =>
      firms.map((company) =>
        company.id === company!.id
          ? {
              ...company,
              branches: [
                ...company.branches,
                {
                  id: crypto.randomUUID(),
                  country,
                  city,
                  hrEmail,
                },
              ],
            }
          : company,
      ),
    );

    country = "";
    city = "";
    hrEmail = "";
  }
</script>

<div class="container">
  {#if company}
    <h2>{company.name}</h2>

    <div>
      <a class="button" href={`/hr/${company.id}`}> Open HR Panel </a>
      <form class="form" on:submit|preventDefault={addBranch}>
        <input
          class="input"
          placeholder="Country"
          bind:value={country}
          required
        />

        <input class="input" placeholder="City" bind:value={city} required />

        <input
          class="input"
          placeholder="HR Email"
          bind:value={hrEmail}
          required
        />

        <button class="button">Add Branch</button>
      </form>
    </div>

    {#if company.description}
      <p>
        {company.description}
      </p>
    {/if}

    <h3>Branches</h3>

    {#if company.branches.length === 0}
      <p>No branches yet.</p>
    {:else}
      {#each company.branches as branch}
        <div class="branch-card">
          <p><strong>Country:</strong> {branch.country}</p>
          <p><strong>City:</strong> {branch.city}</p>
          <p><strong>HR Email:</strong> {branch.hrEmail}</p>
        </div>
      {/each}
    {/if}

    <h3>Job Offers</h3>

    {#if companyJobs.length === 0}
      <p>No job offers for this company yet.</p>
    {:else}
      {#each companyJobs as job}
        <div class="tile">
          <h4>
            <a href={`/jobs/${job.id}`} class="job-link">
              {job.title}
            </a>
          </h4>
          <p><strong>Salary:</strong> {job.salary}</p>
        </div>
      {/each}
    {/if}
  {:else}
    <p>Company not found.</p>
  {/if}
</div>

<style>
  .form {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 10px;
    margin-top: 10px;
  }
</style>
