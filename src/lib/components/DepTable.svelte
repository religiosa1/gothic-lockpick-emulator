<script lang="ts">
	import type { Field } from "$lib/models/Field.svelte";
	import { idxToChar } from "$lib/models/TumblerIdx";

	interface Props {
		field: Field;
	}
	let { field }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<table class="deptable" tabindex="0">
	<thead>
		<tr>
			<th>sel</th>
			{#each Array(field.nTumblers), idx}
				{@const curExpression = field.dependencies[field.selectedTumblerIdx][idx]}
				<th class:dep-neg={curExpression < 0} class:dep-pos={curExpression > 0}>
					{idxToChar(idx)}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each Array(field.nTumblers), idx}
			<tr>
				<th scope="row" class:selected={idx === field.selectedTumblerIdx}>
					{idxToChar(idx)}
				</th>
				{#each Array(field.nTumblers), depIdx}
					{#if depIdx === idx}
						<td>⨯</td>
					{:else}
						{@const expression = field.dependencies[idx][depIdx]}
						<td class="dep-cell" class:dep-pos={expression > 0} class:dep-neg={expression < 0}>
							<button
								class="dep-cell__btn"
								type="button"
								onclick={(e) => {
									const newValue = (() => {
										switch (expression) {
											case 1:
												return e.ctrlKey ? 0 : -1;
											case -1:
												return e.ctrlKey ? 1 : 0;
											default:
												return e.ctrlKey ? -1 : 1;
										}
									})();
									field.dependencies[idx][depIdx] = Math.min(Math.max(newValue, -1), 1);
								}}
							>
								{#if expression === 1}
									+
								{:else if expression === -1}
									-
								{:else if expression !== 0}
									{expression}
								{/if}
							</button>
						</td>
					{/if}
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
<div>
	<small> click to toggle,<br /> ctrl+click backwards</small>
</div>

<button type="button" onclick={() => field.clearDependencies()}>Clear Dependecies</button>

<style>
	.deptable {
		vertical-align: center;
		text-align: center;
		border-collapse: collapse;
		td,
		th {
			border: 1px solid lightgray;
		}
	}
	.dep-cell {
		padding: 0;
	}
	.dep-cell__btn {
		cursor: pointer;
		display: block;
		height: 1.2em;
		background: none;
		border: none;
		min-width: 2.5ch;
		aspect-ratio: 1;
		color: currentColor;
	}
</style>
