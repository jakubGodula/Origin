<script lang="ts">
  import { applications } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";
  import { currentUser } from "$lib/stores/user";
  import { goto } from "$app/navigation";
  import type { ApplicationStatus } from "$lib/stores/applications";

  $: {
    if (!$currentUser) {
      goto("/login");
    }
  }

  function isNotNull<T>(value: T | null): value is T {
    return value !== null;
  }

  $: detailedApplications = $applications
    .map((app) => {
      const job = $jobs.find((j) => j.id === app.jobId);
      if (!job) return null;

      const company = $companies.find((c) => c.id === job.companyId);

      if (
        !company ||
        (company.ownerId && company.ownerId !== $currentUser?.id)
      ) {
        return null;
      }

      return {
        ...app,
        jobTitle: job.title,
        companyName: company?.name ?? "Unknown",
        isOwner: company?.ownerId === $currentUser?.id,
      };
    })
    .filter(isNotNull);

  function updateStatus(jobId: number, newStatus: ApplicationStatus) {
    const job = $jobs.find((j) => j.id === jobId);
    if (!job) return;

    const company = $companies.find((c) => c.id === job.companyId);

    if (!company || company.ownerId !== $currentUser?.id) {
      return;
    }

    applications.update((current) =>
      current.map((app) =>
        app.jobId === jobId ? { ...app, status: newStatus } : app,
      ),
    );
  }
</script>

<div class="container">
  <h2>HR Panel</h2>

  {#if detailedApplications.length === 0}
    <p>No applications yet.</p>
  {:else}
    {#each detailedApplications as app}
      <div class="tile">
        <h3>{app.jobTitle}</h3>

        <p>
          <strong>Company:</strong>
          {app.companyName}
        </p>

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
            disabled={!app.isOwner}
            on:click={() => updateStatus(app.jobId, "reviewed")}
          >
            Reviewed
          </button>

          <button
            class="button"
            disabled={!app.isOwner}
            on:click={() => updateStatus(app.jobId, "accepted")}
          >
            Accept
          </button>

          <button
            class="button"
            disabled={!app.isOwner}
            on:click={() => updateStatus(app.jobId, "rejected")}
          >
            Reject
          </button>
        </div>
      </div>
    {/each}
  {/if}
</div>
