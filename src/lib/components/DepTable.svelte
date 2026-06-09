<script lang="ts">
	import type { Field } from "$lib/models/Field.svelte";
	import { GlobalEditorStateEnum } from "$lib/models/GlobalEditorStateEnum";
	import { idxToChar } from "$lib/models/TumblerIdx";

	interface Props {
		field: Field;
		globalState: GlobalEditorStateEnum;
	}
	let { field, globalState }: Props = $props();

	let table: HTMLTableElement;
	let tbody: HTMLTableSectionElement;
	let horizontalSelectionIndex = $state(0);
	$effect(() => {
		const x = horizontalSelectionIndex;
		const y = field.selectedTumblerIdx;
		if (document.activeElement !== table && !table?.contains(document.activeElement)) {
			return;
		}
		const getEl = (x: number, y: number) => {
			const selector = `[data-idx="${y}"] [data-depidx="${x}"] button`;
			return tbody?.querySelector(selector) as HTMLButtonElement | null;
		};
		let button = getEl(x, y);
		// TODO: search again here, for cases when we hit a diag
		button?.focus();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<table
	bind:this={table}
	class="deptable"
	tabindex="0"
	onkeydown={(e) => {
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "k": {
				field.selectPrevTumbler();
				break;
			}
			case "ArrowDown":
			case "s":
			case "j": {
				field.selectNextTumbler();
				break;
			}
			case "ArrowLeft":
			case "a":
			case "h": {
				// TODO: it seems more intuitive to actually chaange the selection
				// of the row, as you can traverse and fill out the whole table with
				// one keu and a spacebar.
				let newValue = horizontalSelectionIndex - 1;
				// skipping self
				if (newValue === field.selectedTumblerIdx) {
					newValue--;
				}
				if (newValue < 0) {
					newValue =
						field.selectedTumblerIdx === field.nTumblers - 1
							? field.nTumblers - 2
							: field.nTumblers - 1;
				}
				horizontalSelectionIndex = newValue;
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				let newValue = horizontalSelectionIndex + 1;
				// skipping self
				if (newValue === field.selectedTumblerIdx) {
					newValue++;
				}
				if (newValue >= field.nTumblers) {
					newValue = field.selectedTumblerIdx === 0 ? 1 : 0;
				}
				horizontalSelectionIndex = newValue;
				break;
			}
		}
	}}
>
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
	<tbody bind:this={tbody}>
		{#each Array(field.nTumblers), idx}
			<tr data-idx={idx} class:selected-row={idx === field.selectedTumblerIdx}>
				<th scope="row">
					{idxToChar(idx)}
				</th>
				{#each Array(field.nTumblers), depIdx}
					{#if depIdx === idx}
						<td>⨯</td>
					{:else}
						{@const expression = field.dependencies[idx][depIdx]}
						<td
							data-depidx={depIdx}
							class="dep-cell"
							class:dep-pos={expression > 0}
							class:dep-neg={expression < 0}
						>
							<button
								class="dep-cell__btn"
								type="button"
								disabled={globalState !== GlobalEditorStateEnum.lockCreation}
								title={globalState !== GlobalEditorStateEnum.lockCreation
									? "Switch to lock editing mode to modify"
									: undefined}
								onclick={(e) => {
									// TODO: also move field selected item and horizontalSelectionIndex
									// here
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
	<small>
		click to toggle,<br /> ctrl+click backwards
	</small>
</div>

<button
	type="button"
	disabled={globalState !== GlobalEditorStateEnum.lockCreation}
	title={globalState !== GlobalEditorStateEnum.lockCreation
		? "Switch to lock editing mode to modify"
		: undefined}
	onclick={() => field.clearDependencies()}>Clear Dependecies</button
>

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
	.deptable :is(td, th) {
		padding: 0;
		width: var(--pin-size);
		height: var(--pin-size);
		position: relative;
	}
	.dep-cell__btn {
		all: unset;
		cursor: pointer;
		display: block;
		position: absolute;
		inset: 0;
		background: none;
		border: none;
		color: currentColor;
		font-size: 1.2rem;
	}
	.dep-cell__btn:disabled {
		cursor: not-allowed;
	}
	.selected-row {
		td,
		th {
			background-color: var(--clr-bg-hl);
		}
		th {
			color: var(--clr-hl);
		}
	}
</style>
