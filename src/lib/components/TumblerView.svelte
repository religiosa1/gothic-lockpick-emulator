<script lang="ts">
	import type { Tumbler } from "$lib/models/Tumbler.svelte";
	import { tumblerMouseDrag } from "$lib/attachments/tumblerMouseDrag";
	import { failedMoveAnimation } from "$lib/attachments/failedMoveAnnimation";

	interface Props {
		tumbler: Tumbler;
		width: number;
		targetRow: number;
		idx: number;
	}
	let { tumbler, width, targetRow, idx }: Props = $props();
	let offset = $derived(width - tumbler.currentPosition - 1);
</script>

<ul
	data-pos={tumbler.currentPosition}
	style:--offset={offset}
	class="tumbler"
	{@attach tumblerMouseDrag(idx)}
	{@attach failedMoveAnimation(idx)}
>
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
		touch-action: pan-y;
		cursor: ew-resize;
		user-select: none;
		margin-left: calc(var(--pin-size) * var(--offset));
		transition: var(--transition-props);
		transition-property: margin-left;
	}
	:global(.tumbler.failed-move) {
		animation: shake 1s infinite;
		outline: 1px solid var(--clr-danger);
	}
	.pin {
		flex-shrink: 0;
		flex-grow: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--pin-size);
		aspect-ratio: 1;
		box-sizing: border-box;
		padding: calc(var(--pin-size) * 0.1);
		@media (width < 66ch) {
			aspect-ratio: 1/1.6;
		}
	}
	.pin::after {
		content: "";
		display: block;
		border-radius: 50%;
		width: 80%;
		aspect-ratio: 1;
		margin: auto;
		background: black;
		transition: var(--transition-props);
		transition-property: background-color;
	}
	.pin.pin-current::after {
		background: gold;
	}
	.pin-target::after {
		background: #aa0000;
	}
	.pin-current.pin-target::after {
		background: red;
	}

	@keyframes shake {
		0%,
		100% {
			rotate: 0deg;
			translate: 0 0;
		}
		10% {
			rotate: -1deg;
		}
		20% {
			rotate: 1deg;
		}
		30% {
			rotate: -1deg;
			translate: 1px 0;
		}
		40% {
			rotate: 1deg;
		}
		50% {
			rotate: -1deg;
		}
		60% {
			rotate: 1deg;
			translate: -1px 0;
		}
		70% {
			rotate: -1deg;
		}
		80% {
			rotate: 1deg;
		}
		90% {
			rotate: -1deg;
		}
	}
</style>
