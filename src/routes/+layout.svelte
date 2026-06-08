<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

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
	:global {
		:root {
			--clr-brd: lightgray;
			--clr-bg: white;
			--body-pad: 0.5rem;
		}
		html {
			margin: 0;
			padding: 0;
			min-height: 100dvh;
		}
		body {
			max-width: 1200px;
			margin: 0 auto;
			display: grid;
			grid-template-areas:
				"header"
				"main"
				"footer";
			font-family:
				Roboto,
				"Segoe UI",
				-apple-system,
				Helvetica,
				Arial,
				sans-serif;
			font-size: 16px;
			grid-template-rows: auto 1fr auto;
			min-height: 100vh;
			min-height: 100dvh;
			padding: 0;
		}
	}

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
