<script lang="ts">
  import { applications } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";
  import type { ApplicationStatus } from "$lib/stores/applications";

  function updateStatus(jobId: number, newStatus: ApplicationStatus) {
    applications.update((current) =>
      current.map((app) =>
        app.jobId === jobId ? { ...app, status: newStatus } : app,
      ),
    );
  }

  function isNotNull<T>(value: T | null): value is T {
    return value !== null;
  }

  let selectedCompany = "";

  $: detailedApplications = $applications
    .map((app) => {
      const job = $jobs.find((j) => j.id === app.jobId);
      if (!job) return null;

      const company = $companies.find((c) => c.id === job.companyId);

      if (selectedCompany && job.companyId !== selectedCompany) {
        return null;
      }

      return {
        ...app,
        jobTitle: job.title,
        companyName: company?.name ?? "Unknown",
      };
    })
    .filter(isNotNull);
</script>

<div class="container">
  <div class="header">
    <h2>HR Panel</h2>

    <select class="input" bind:value={selectedCompany}>
      <option value="">All companies</option>

      {#each $companies as company}
        <option value={company.id}>
          {company.name}
        </option>
      {/each}
    </select>
  </div>

  <p>
    {detailedApplications.length} application{detailedApplications.length === 1
      ? ""
      : "s"}
  </p>

  {#if detailedApplications.length === 0}
    <p>No applications yet.</p>
  {:else}
    {#each detailedApplications as app}
      <div class="tile">
        <h3>{app.jobTitle}</h3>
        <p><strong>Company:</strong> {app.companyName}</p>
        <p>
          <strong>Applied at:</strong>
          {new Date(app.appliedAt).toLocaleString()}
        </p>

        <p>
          <strong>Status:</strong>
          <span class={`status ${app.status}`}>
            {app.status}
          </span>
        </p>

        <div class="buttons">
          <button
            class="button"
            on:click={() => updateStatus(app.jobId, "reviewed")}
          >
            Mark Reviewed
          </button>
          <button
            class="button"
            on:click={() => updateStatus(app.jobId, "accepted")}
          >
            Accept
          </button>
          <button
            class="button"
            on:click={() => updateStatus(app.jobId, "rejected")}
          >
            Reject
          </button>
        </div>
      </div>
    {/each}
  {/if}
</div>
