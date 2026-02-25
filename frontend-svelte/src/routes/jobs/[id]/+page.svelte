<script lang="ts">
  import { page } from "$app/stores";
  import { jobs } from "$lib/stores/jobs";
  import { applications } from "$lib/stores/applications";
  import type { Job } from "$lib/stores/jobs";

  let job: Job | undefined;

  $: {
    const id = Number($page.params.id);
    job = $jobs.find((j) => j.id === id);
  }

  function apply() {
    if (!job) return;

    const currentJob = job;

    applications.update((current) => [
      ...current,
      { jobId: currentJob.id, appliedAt: Date.now() },
    ]);
  }

  $: isApplied = job ? $applications.some((a) => a.jobId === job?.id) : false;
</script>

<div class="container">
  {#if job}
    <h2>{job.title}</h2>
    <p><strong>Company:</strong> {job.company}</p>
    <p><strong>Location:</strong> {job.location}</p>
    <p><strong>Salary:</strong> {job.salary}</p>

    {#if job.description}
      <p style="margin-top: 16px;">
        <strong>Description:</strong><br />
        {job.description}
      </p>
    {/if}

    <button
      class="button"
      style="margin-top:20px;"
      on:click={apply}
      disabled={isApplied}
    >
      {isApplied ? "Already Applied" : "Apply Now"}
    </button>
  {:else}
    <p>Job not found.</p>
  {/if}
</div>
