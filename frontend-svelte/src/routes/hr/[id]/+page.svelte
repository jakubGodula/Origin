<script lang="ts">
  import { page } from "$app/stores";
  import { applications } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { organizations } from "$lib/stores/organizations";
  import type { ApplicationStatus } from "$lib/stores/applications";
  import type { Organization } from "$lib/stores/organizations";

  let organization: Organization | undefined;

  $: {
    const id = $page.params.id;
    organization = $organizations.find((o) => o.id === id);
  }

  function updateStatus(jobId: number, newStatus: ApplicationStatus) {
    applications.update((current) =>
      current.map((app) =>
        app.jobId === jobId ? { ...app, status: newStatus } : app,
      ),
    );
  }

  let organizationApplications: {
    jobId: number;
    appliedAt: number;
    status: ApplicationStatus;
    jobTitle: string;
  }[] = [];

  $: {
    if (organization) {
      const orgId = organization.id;

      organizationApplications = $applications
        .map((app) => {
          const job = $jobs.find((j) => j.id === app.jobId);
          if (!job) return null;
          if (job.organizationId !== orgId) return null;

          return {
            ...app,
            jobTitle: job.title,
          };
        })
        .filter((app): app is NonNullable<typeof app> => app !== null);
    } else {
      organizationApplications = [];
    }
  }
</script>

<div class="container">
  {#if organization}
    <h2>HR Panel — {organization.name}</h2>

    {#if organizationApplications.length === 0}
      <p>No applications for this organization yet.</p>
    {:else}
      {#each organizationApplications as app}
        <div class="job-card">
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

          <div class="buttons-three">
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
    <p>Organization not found.</p>
  {/if}
</div>
