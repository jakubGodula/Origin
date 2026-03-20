<script lang="ts">
  import { currentUser } from "$lib/stores/user";
  import { goto } from "$app/navigation";

  let email = "";

  function login() {
    if (!email) return;

    currentUser.set({
      id: crypto.randomUUID(),
      email,
    });

    goto("/");
  }
</script>

<div class="container">
  <input class="input" bind:value={email} placeholder="Email" />
  <button class="button" type="submit" on:click={login}>Login</button>
</div>
