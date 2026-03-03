<script lang="ts">
  import { applications } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { organizations } from "$lib/stores/organizations";
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

  $: detailedApplications = $applications
    .map((app) => {
      const job = $jobs.find((j) => j.id === app.jobId);
      if (!job) return null;
      const organization = $organizations.find(
        (o) => o.id === job.organizationId,
      );
      return {
        ...app,
        jobTitle: job.title,
        organizationName: organization?.name ?? "Unknown",
      };
    })
    .filter(isNotNull);
</script>

<div class="container">
  <h2>HR Panel</h2>

  {#if detailedApplications.length === 0}
    <p>No applications yet.</p>
  {:else}
    {#each detailedApplications as app}
      <div class="job-card">
        <h3>{app.jobTitle}</h3>
        <p><strong>Organization:</strong> {app.organizationName}</p>
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

        <div class="buttons-three">
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
