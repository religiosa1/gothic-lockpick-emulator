<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	let props: HTMLInputAttributes = $props();
</script>

<input {...props} type="checkbox" />
<span class="toggler"></span>

<style>
	input {
		all: unset;
		appearance: none;
		visibility: hidden;
	}
	.toggler {
		cursor: pointer;
		display: inline-block;
		margin: 0 0.2em;
		width: 1.6em;
		height: 0.8em;
		border: 1px solid #a3a3a3;
		text-align: center;
		border-radius: 50% / 0.8em;
		padding: 1px;
		box-sizing: content-box;
		background-color: light-dark(rgba(239, 239, 239, 0.3), rgba(59, 59, 59, 0.3));
		transition: 0.15s ease-in-out;
		transition-property: background-color;
	}
	.toggler:not(:disabled):hover {
		background-color: #e5e5e5;
	}
	input:checked ~ .toggler {
		background-color: var(--clr-hl);
	}
	input:checked:not(:disabled) ~ .toggler:hover {
		background-color: lch(from var(--clr-hl) calc(l * 0.9) c h);
	}

	.toggler::after {
		box-sizing: border-box;
		content: "";
		display: block;
		height: 100%;
		--ar: 1;
		aspect-ratio: var(--ar);
		border-radius: 0.8em;
		border: 1.2px solid light-dark(rgb(84, 84, 84), rgb(170, 170, 170));
		background-color: white;
		transition: 0.15s ease-in-out;
		transition-property: translate, aspect-ratio;
	}
	.toggler:active::after {
		--ar: 1.1;
	}
	input:checked ~ .toggler::after {
		translate: calc((2 - var(--ar)) / var(--ar) * 100%) 0;
	}
	input:disabled ~ .toggler::after {
		border-color: rgba(118, 118, 118, 0.3);
		background-color: light-dark(rgba(239, 239, 239, 0.3), rgba(19, 1, 1, 0.3));
	}
</style>
