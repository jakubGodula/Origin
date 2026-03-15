<script lang="ts">
  import { page } from "$app/stores";
  import { applications } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";
  import type { Company } from "$lib/stores/companies";
  import type { ApplicationStatus } from "$lib/stores/applications";

  let company: Company | undefined;

  $: {
    const id = $page.params.id;
    company = $companies.find((o) => o.id === id);
  }

  function updateStatus(jobId: number, newStatus: ApplicationStatus) {
    applications.update((current) =>
      current.map((app) =>
        app.jobId === jobId ? { ...app, status: newStatus } : app,
      ),
    );
  }

  let companyApplications: {
    jobId: number;
    appliedAt: number;
    status: ApplicationStatus;
    jobTitle: string;
  }[] = [];

  $: {
    if (company) {
      const orgId = company.id;

      companyApplications = $applications
        .map((app) => {
          const job = $jobs.find((j) => j.id === app.jobId);
          if (!job) return null;
          if (job.companyId !== orgId) return null;

          return {
            ...app,
            jobTitle: job.title,
          };
        })
        .filter((app): app is NonNullable<typeof app> => app !== null);
    } else {
      companyApplications = [];
    }
  }
</script>

<div class="container">
  {#if company}
    <h2>HR Panel — {company.name}</h2>

    {#if companyApplications.length === 0}
      <p>No applications for this company yet.</p>
    {:else}
      {#each companyApplications as app}
        <div class="tile">
          <h3>{app.jobTitle}</h3>

          <p>
            <strong>Status:</strong>
            <span class={`status ${app.status}`}>
              {app.status}
            </span>
          </p>

          <p>
            <strong>Applied at:</strong>
            {new Date(app.appliedAt).toLocaleString()}
          </p>

          <div class="buttons">
            <button
              class="button"
              on:click={() => updateStatus(app.jobId, "reviewed")}
            >
              Reviewed
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
  {:else}
    <p>Company not found.</p>
  {/if}
</div>
