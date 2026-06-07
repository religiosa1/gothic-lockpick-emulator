<script lang="ts">
	import type { Tumbler } from "../models/Tumbler.svelte";

	interface Props {
		tumbler: Tumbler;
		width: number;
		targetRow: number;
		idx: number;
	}
	let { tumbler, width, targetRow, idx }: Props = $props();
	let offset = $derived(width - tumbler.currentPosition - 1);

	$effect(() => {});
</script>

<ul
	data-pos={tumbler.currentPosition}
	data-offset={offset}
	class="tumbler"
	{@attach (el) => {
		const ac = new AbortController();
		document.addEventListener(
			"failed-tumbler-move",
			(e) => {
				if (!e.detail.indexes.includes(idx)) {
					return;
				}
				el.style.animation = "tumbler-shake 1s";
				el.addEventListener(
					"animationend",
					() => {
						el.style.animation = "";
					},
					{ once: true }
				);
			},
			{ signal: ac.signal }
		);
		return () => ac.abort();
	}}
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
		background: #aa0000;
	}
	.pin-current.pin-target::after {
		background: red;
	}

	:global {
		@keyframes tumbler-shake {
			0%,
			100% {
				rotate: 0deg;
				translate: 0 0;
				outline: 1px solid red;
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
	}
</style>
