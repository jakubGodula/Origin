<script lang="ts">
  import { jobs } from "$lib/stores/jobs";

  let title = "";
  let company = "";
  let location = "";
  let salary = "";
  let description = "";

  let success = false;

  function submitJob() {
    if (!title || !company || !location || !salary) return;

    const newJob = {
      id: Date.now(),
      title,
      company,
      location,
      salary,
      description,
    };

    jobs.update((current) => [...current, newJob]);

    success = true;

    title = "";
    company = "";
    location = "";
    salary = "";
    description = "";

    setTimeout(() => {
      success = false;
    }, 5000);
  }
</script>

<div class="container">
  <h2>Post a Job</h2>

  <form on:submit|preventDefault={submitJob}>
    <input class="input" placeholder="Job title" bind:value={title} required />
    <input class="input" placeholder="Company" bind:value={company} required />
    <input
      class="input"
      placeholder="Location"
      bind:value={location}
      required
    />
    <input
      class="input"
      placeholder="Salary range"
      bind:value={salary}
      required
    />

    <textarea
      class="input"
      placeholder="Job description"
      rows="4"
      bind:value={description}
    ></textarea>

    <button class="button" type="submit">Post Job</button>
  </form>
</div>

{#if success}
  <div class="success">Job posted successfully!</div>
{/if}
