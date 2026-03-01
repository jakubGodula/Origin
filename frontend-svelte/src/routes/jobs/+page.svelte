<script lang="ts">
  import { jobs } from "$lib/stores/jobs";
  import { organizations } from "$lib/stores/organizations";
</script>

<div class="container">
  <h2>Job Offers</h2>

  {#if $jobs.length === 0}
    <p>No job offers yet.</p>
  {/if}

  {#each $jobs as job}
    {@const organization = $organizations.find(
      (o) => o.id === job.organizationId,
    )}

    {@const branch = organization?.branches.find((b) => b.id === job.branchId)}

    <div class="job-card">
      <h3>
        <a href={`/jobs/${job.id}`} class="job-link">
          {job.title}
        </a>
      </h3>

      <p>
        <strong>Organization:</strong>
        {organization ? organization.name : "Unknown"}
      </p>

      <p>
        <strong>Location:</strong>
        {branch ? `${branch.country} - ${branch.city}` : "Unknown"}
      </p>

      <p><strong>Salary:</strong> {job.salary}</p>
    </div>
  {/each}
</div>
