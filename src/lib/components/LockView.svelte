<script lang="ts">
	import { MediaQuery } from "svelte/reactivity";
	import { failedMoveAnimation } from "$lib/attachments/failedMoveAnnimation";
	import type { Field } from "$lib/models/Field.svelte";
	import TumblerView from "./TumblerView.svelte";

	interface Props {
		field: Field;
		lockViewEl: HTMLUListElement | undefined;
	}
	let { field, lockViewEl = $bindable() }: Props = $props();
	const isMobile = new MediaQuery("(width < 66ch)");
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_autofocus -->
<ul
	bind:this={lockViewEl}
	tabindex="0"
	class="tumblers-list"
	style:--field-width={(field.tumblerWidth - 1) * 2 + 1}
>
	{#each field.tumblers as tumbler, idx}
		{@const depExpression = field.dependencies[field.selectedTumblerIdx][idx]}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<li
			class="tumblers-list__item"
			class:selected={idx === field.selectedTumblerIdx}
			class:dep-neg={depExpression < 0}
			class:dep-pos={depExpression > 0}
			onpointerdown={() => (field.selectedTumblerIdx = idx)}
			{@attach failedMoveAnimation(idx)}
		>
			<TumblerView {tumbler} width={field.tumblerWidth} targetRow={field.tumblerRow} {idx} />
		</li>
	{/each}
</ul>
<small>
	{#if isMobile.current}
		drag tumblers left and right
	{:else}
		use arrow keys, wasd or hjkl for modifying
	{/if}
</small>

<style>
	.tumblers-list {
		counter-reset: tumblers;
		display: block;
		width: max-content;
		width: calc(var(--pin-size) * var(--field-width));
		margin: 0;
		padding: 0 0 0 var(--pin-size);
		list-style: none;
	}
	.tumblers-list__item {
		position: relative;
		margin: 1px 0;
		&::before {
			counter-increment: tumblers;
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			content: counter(tumblers, upper-alpha);
			inset: 0;
			right: auto;
			left: calc(var(--pin-size) * -1);
		}
	}
	.tumblers-list__item.dep-neg {
		background: var(--clr-bg-neg);
	}
	.tumblers-list__item.dep-pos {
		background: var(--clr-bg-pos);
	}
	.tumblers-list__item.selected {
		outline-color: var(--clr-hl);
		outline: 2px solid;
		background: var(--clr-bg-hl);
	}
	:global(.tumblers-list__item.failed-move::before) {
		text-decoration: underline;
		text-decoration-style: wavy;
		text-decoration-color: var(--clr-danger);
	}
</style>
