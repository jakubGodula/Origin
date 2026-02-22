<script>
  let name = "";
  let address = "";
  let email = "";
  let phone = "";
  let phoneError = "";

  function validatePhone() {
    const phoneRegex = /^[0-9]{9,15}$/;
    return phoneRegex.test(phone);
  }

  function registerEmployee() {
    if (!validatePhone()) {
      phoneError = "Phone must be 9–15 digits";
      return;
    }

    phoneError = "";
    console.log({ name, address, email, phone });
  }
</script>

<div class="container">
  <h2>Employee registration</h2>

  <form on:submit|preventDefault={registerEmployee}>
    <input class="input" placeholder="Name" bind:value={name} required />
    <input class="input" placeholder="Address" bind:value={address} required />

    <input class="input" placeholder="Phone" bind:value={phone} required />
    {#if phoneError}
      <p class="error">{phoneError}</p>
    {/if}

    <input
      class="input"
      placeholder="Email"
      type="email"
      bind:value={email}
      required
    />

    <button class="button" type="submit">Register</button>
  </form>
</div>
