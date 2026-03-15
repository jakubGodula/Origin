<script lang="ts">
  import { page } from "$app/stores";
  import { jobs } from "$lib/stores/jobs";
  import { companies } from "$lib/stores/companies";
  import { applications } from "$lib/stores/applications";
  import type { Job } from "$lib/stores/jobs";

  let job: Job | undefined;

  $: {
    const id = Number($page.params.id);
    job = $jobs.find((j) => j.id === id);
  }

  $: company = job
    ? $companies.find((o) => o.id === job?.companyId)
    : undefined;

  $: branch = company
    ? company.branches.find((b) => b.id === job?.branchId)
    : undefined;

  function apply() {
    if (!job) return;

    const currentJob = job;

    applications.update((current) => [
      ...current,
      { jobId: currentJob.id, appliedAt: Date.now(), status: "pending" },
    ]);
  }

  $: isApplied = job ? $applications.some((a) => a.jobId === job?.id) : false;
</script>

<div class="container">
  {#if job}
    <h2>{job.title}</h2>

    <p>
      <strong>Company:</strong>
      {company ? company.name : "Unknown"}
    </p>

    <p>
      <strong>Location:</strong>
      {branch ? `${branch.country} — ${branch.city}` : "Unknown"}
    </p>

    <p><strong>Salary:</strong> {job.salary}</p>

    {#if job.description}
      <p>
        <strong>Description:</strong><br />
        {job.description}
      </p>
    {/if}

    <button
      class="button"
      on:click={apply}
      disabled={isApplied}
    >
      {isApplied ? "Already Applied" : "Apply Now"}
    </button>
  {:else}
    <p>Job not found.</p>
  {/if}
</div>
