<script lang="ts">
  import { page } from "$app/stores";
  import { organizations } from "$lib/stores/organizations";
  import type { Organization } from "$lib/stores/organizations";
  import { jobs } from "$lib/stores/jobs";
  import type { Job } from "$lib/stores/jobs";

  let organization: Organization | undefined;

  $: {
    const id = $page.params.id;
    organization = $organizations.find((o) => o.id === id);
  }

  let organizationJobs: Job[] = [];

  $: {
    if (organization) {
      const orgId = organization.id;

      organizationJobs = $jobs.filter((job) => job.organizationId === orgId);
    } else {
      organizationJobs = [];
    }
  }
</script>

<div class="container">
  {#if organization}
    <h2>{organization.name}</h2>

    <div>
      <a class="button" href={`/hr/${organization.id}`}> Open HR Panel </a>
    </div>

    {#if organization.description}
      <p style="margin-bottom:20px;">
        {organization.description}
      </p>
    {/if}

    <h3>Branches</h3>

    {#if organization.branches.length === 0}
      <p>No branches yet.</p>
    {:else}
      {#each organization.branches as branch}
        <div class="branch-card">
          <p><strong>Country:</strong> {branch.country}</p>
          <p><strong>City:</strong> {branch.city}</p>
          <p><strong>HR Email:</strong> {branch.hrEmail}</p>
        </div>
      {/each}
    {/if}

    <h3 style="margin-top:30px;">Job Offers</h3>

    {#if organizationJobs.length === 0}
      <p>No job offers for this organization yet.</p>
    {:else}
      {#each organizationJobs as job}
        <div class="tile">
          <h4>
            <a href={`/jobs/${job.id}`} class="job-link">
              {job.title}
            </a>
          </h4>
          <p><strong>Salary:</strong> {job.salary}</p>
        </div>
      {/each}
    {/if}
  {:else}
    <p>Organization not found.</p>
  {/if}
</div>
