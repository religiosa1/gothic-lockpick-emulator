<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "$lib/assets/globalStyles.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<h1>Gothic Lockpicking Emulator</h1>
</header>
<main>
	{@render children()}
</main>
<footer>
	<a href="https://github.com/religiosa1/gothic-lockpick-emulator/">Github</a>
</footer>

<style>
	h1 {
		margin: 1rem 0;
	}

	header {
		grid-area: header;
		padding: var(--body-pad);
	}
	main {
		grid-area: main;
		padding: var(--body-pad);
	}
	footer {
		grid-area: footer;
		padding: var(--body-pad);
	}
</style>
