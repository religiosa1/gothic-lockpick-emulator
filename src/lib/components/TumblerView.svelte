<script lang="ts">
	import type { Tumbler } from "../models/Tumbler.svelte";

	interface Props {
		tumbler: Tumbler;
		width: number;
		targetRow: number;
	}
	let { tumbler, width, targetRow }: Props = $props();
	let offset = $derived(width - tumbler.currentPosition - 1);
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
		--transition-props: 80ms ease-in;
		display: flex;
		flex-flow: row nowrap;
		width: max-content;
		margin: 0;
		padding: 0;
		list-style: none;
		background: lightblue;
		--offset: attr(data-offset type(<number>), 0);
		margin-left: calc(var(--pin-width) * var(--offset));
		transition: var(--transition-props);
		transition-property: margin-left;
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
		content: "";
		display: block;
		border-radius: 50%;
		width: 80%;
		height: 80%;
		margin: auto;
		background: black;
		transition: var(--transition-props);
		transition-property: background-color;
	}
	.pin.pin-current::after {
		background: gold;
	}
	.pin-target::after {
		background: #660000;
	}
	.pin-current.pin-target::after {
		background: red;
	}
</style>
