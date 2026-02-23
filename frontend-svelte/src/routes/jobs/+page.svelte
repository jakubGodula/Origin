<script lang="ts">
  import { jobs } from "$lib/stores/jobs";
</script>

<div class="container">
  <h2>Job Offers</h2>

  {#if $jobs.length === 0}
    <p>No job offers yet.</p>
  {/if}

  {#each $jobs as job}
    <div class="job-card">
      <h3>{job.title}</h3>
      <p><strong>Company:</strong> {job.company}</p>
      <p><strong>Location:</strong> {job.location}</p>
      <p><strong>Salary:</strong> {job.salary}</p>
      <button class="button small">Apply</button>
    </div>
  {/each}
</div>
