<script lang="ts">
  import { companies } from "$lib/stores/companies";
  import type { Company, Branch } from "$lib/stores/companies";
  import { goto } from "$app/navigation";

  let name = "";
  let description = "";
  let error = "";

  let branches: Branch[] = [
    {
      id: crypto.randomUUID(),
      country: "",
      city: "",
      hrEmail: "",
    },
  ];

  function addBranch() {
    branches = [
      ...branches,
      {
        id: crypto.randomUUID(),
        country: "",
        city: "",
        hrEmail: "",
      },
    ];
  }

  function removeBranch(id: string) {
    if (branches.length === 1) {
      error = "At least one branch is required.";
      return;
    }

    branches = branches.filter((b) => b.id !== id);
  }

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function saveCompany() {
    error = "";

    if (!name.trim()) {
      error = "Company name is required.";
      return;
    }

    if (branches.length === 0) {
      error = "At least one branch is required.";
      return;
    }

    for (const branch of branches) {
      if (!branch.country.trim() || !branch.city.trim()) {
        error = "Country and city are required for each branch.";
        return;
      }

      if (!validateEmail(branch.hrEmail)) {
        error = "Each branch must have a valid HR email.";
        return;
      }
    }

    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      description,
      branches,
    };

    companies.update((current) => [...current, newCompany]);

    goto("/companies");
  }
</script>

<div class="container">
  <h2>Create Company</h2>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="branch-card">
    <input class="input" placeholder="Company Name" bind:value={name} />

    <textarea class="input" placeholder="Description" bind:value={description}
    ></textarea>
  </div>

  <h3>HR Branches</h3>

  {#each branches as branch (branch.id)}
    <div class="branch-card">
      <input class="input" placeholder="Country" bind:value={branch.country} />

      <input class="input" placeholder="City" bind:value={branch.city} />

      <input class="input" placeholder="HR Email" bind:value={branch.hrEmail} />

      <div>
        <button
          type="button"
          class="button danger"
          on:click={() => removeBranch(branch.id)}
        >
          Remove Branch
        </button>
      </div>
    </div>
  {/each}

  <div class="buttons">
    <button type="button" class="button" on:click={addBranch}>
      + Add Branch
    </button>

    <button type="button" class="button" on:click={saveCompany}>
      Save Company
    </button>
  </div>
</div>

<style>
  .error {
    color: red;
    font-size: 14px;
    margin-top: -6px;
  }

  .danger {
    background: #d33;
  }

  .danger:hover {
    opacity: 0.8;
  }
</style>
