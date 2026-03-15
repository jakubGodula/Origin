<script lang="ts">
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";

  $: expandedJobs = $jobs.map((job) => {
    const company = $companies.find((c) => c.id === job.companyId);

    const branch = company?.branches.find((b) => b.id === job.branchId);

    return {
      ...job,
      companyName: company?.name ?? "Unknown",
      location: branch ? `${branch.city}, ${branch.country}` : "Unknown",
    };
  });

  let search = "";
  let selectedCompany = "";
  let selectedLocation = "";

  $: filteredJobs = expandedJobs.filter((job) => {
    const text = search.toLowerCase();

    const searchableText = `
      ${job.title}
      ${job.companyName}
      ${job.location}
      ${job.salary}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(text);

    const matchesCompany =
      !selectedCompany || job.companyId === selectedCompany;

    const matchesLocation =
      !selectedLocation || job.location === selectedLocation;

    return matchesSearch && matchesCompany && matchesLocation;
  });

  $: locations = [...new Set(expandedJobs.map((job) => job.location))];
</script>

<div class="container">
  <div class="filters">
    <input
      class="input"
      placeholder="🔍 Search jobs, companies, locations..."
      bind:value={search}
    />

    <select class="input" bind:value={selectedCompany}>
      <option value="">All companies</option>

      {#each $companies as company}
        <option value={company.id}>
          {company.name}
        </option>
      {/each}
    </select>

    <select class="input" bind:value={selectedLocation}>
      <option value="">All locations</option>

      {#each locations as loc}
        <option value={loc}>
          {loc}
        </option>
      {/each}
    </select>
  </div>

  <p>
    {filteredJobs.length} job{`${filteredJobs.length !== 1 ? "s" : ""}`} found
  </p>

  <div class="header">
    <h2>Job Offers</h2>
    <a href="/post-job" class="button">+ Post a Job</a>
  </div>

  {#if $jobs.length === 0}
    <p>No job offers yet.</p>
  {/if}

  {#each filteredJobs as job}
    <div class="tile">
      <h3>
        <a href={`/jobs/${job.id}`} class="job-link">
          {job.title}
        </a>
      </h3>

      <p>
        <strong>Company:</strong>
        {job.companyName}
      </p>

      <p>
        <strong>Location:</strong>
        {job.location}
      </p>

      <p>
        <strong>Salary:</strong>
        {job.salary}
      </p>
    </div>
  {/each}
</div>

<style>
  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .filters input {
    flex: 2;
  }

  .filters select {
    flex: 1;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
</style>
