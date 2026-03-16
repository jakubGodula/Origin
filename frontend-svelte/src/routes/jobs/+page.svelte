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
  let sortBy = "newest";

  function parseSalary(salary: string) {
    const match = salary.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  $: filteredJobs = expandedJobs
    .filter((job) => {
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
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.id - a.id;
      }

      if (sortBy === "salary-asc") {
        return parseSalary(a.salary) - parseSalary(b.salary);
      }

      if (sortBy === "salary-desc") {
        return parseSalary(b.salary) - parseSalary(a.salary);
      }

      return 0;
    });

  $: locations = [...new Set(expandedJobs.map((job) => job.location))];
</script>

<div class="container">
  <div class="filters">
    <input
      class="input"
      placeholder="🔍 Search jobs, companies..."
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

    <select class="input" bind:value={sortBy}>
      <option value="newest">Newest</option>
      <option value="salary-asc">Salary ↑</option>
      <option value="salary-desc">Salary ↓</option>
    </select>
  </div>

  <button
    class="button"
    on:click={() => {
      search = "";
      selectedCompany = "";
      selectedLocation = "";
      sortBy = "newest";
    }}
  >
    Reset filters
  </button>

  <p>
    {filteredJobs.length} job{`${filteredJobs.length === 1 ? "" : "s"}`} found
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
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .filters input {
    flex: 2;
  }

  .filters select {
    flex: 1;
  }
</style>
