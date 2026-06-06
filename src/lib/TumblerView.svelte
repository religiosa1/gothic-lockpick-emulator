<script lang="ts">
	import type { Tumbler } from './models/Tumbler.svelte';

	interface Props {
		tumbler: Tumbler;
		width: number;
		targetRow: number;
	}
	let { tumbler, width, targetRow }: Props = $props();
	let offset = $derived(width - tumbler.currentPosition);
</script>

<ul data-pos={tumbler.currentPosition} data-offset={offset} class="tumbler">
	{#each Array(width), idx}
		<li
			class="pin"
			class:pin-target={idx === targetRow}
			class:pin-current={idx === tumbler.currentPosition}
		></li>
	{/each}
</ul>

<style>
	.tumbler {
		display: inline-flex;
		flex-flow: row nowrap;
		margin: 0;
		padding: 0;
		list-style: none;
		background: lightblue;
		--offset: attr(data-offset type(<number>), 0);
		margin-left: calc(var(--pin-width) * var(--offset));
	}
	.pin {
		flex-shrink: 0;
		flex-grow: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--pin-width);
		aspect-ratio: 1;
		box-sizing: border-box;
		padding: calc(var(--pin-width) * 0.1);
	}
	.pin::after {
		content: '';
		display: block;
		border-radius: 50%;
		width: 80%;
		height: 80%;
		margin: auto;
		background: black;
	}
	.pin.pin-current::after {
		background: yellow;
	}
	.pin-target::after {
		background: brown;
	}
	.pin-current.pin-target::after {
		background: darkorange;
	}
</style>
