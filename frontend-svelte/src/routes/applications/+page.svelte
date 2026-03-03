<script lang="ts">
  import { applications } from "$lib/stores/applications";
  import type { ApplicationStatus } from "$lib/stores/applications";
  import { jobs } from "$lib/stores/jobs";
  import { organizations } from "$lib/stores/organizations";
  import type { Job } from "$lib/stores/jobs";

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
  }

  $: appliedJobs = $applications
    .map((app) => {
      const job = $jobs.find((j) => j.id === app.jobId);
      if (!job) return null;

      const organization = $organizations.find(
        (o) => o.id === job.organizationId,
      );

      return {
        ...job,
        appliedAt: app.appliedAt,
        status: app.status,
        organizationName: organization?.name ?? "Unknown",
      };
    })
    .filter(Boolean) as (Job & {
    appliedAt: number;
    organizationName: string;
    status: ApplicationStatus;
  })[];
</script>

<div class="container">
  <h2>My Applications</h2>

  {#if appliedJobs.length === 0}
    <p>You haven't applied to any jobs yet.</p>
  {:else}
    {#each appliedJobs as job}
      <div class="tile">
        <h3>
          <a href={`/jobs/${job.id}`} class="job-link">
            {job.title}
          </a>
        </h3>

        <p><strong>Organization:</strong> {job.organizationName}</p>
        <p><strong>Salary:</strong> {job.salary}</p>
        <p><strong>Applied at:</strong> {formatDate(job.appliedAt)}</p>
        <p>
          <strong>Status:</strong>
          <span class={`status ${job.status}`}>
            {job.status}
          </span>
        </p>
      </div>
    {/each}
  {/if}
</div>
