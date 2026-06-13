<script lang="ts">
	import { MediaQuery } from "svelte/reactivity";
	import type { Field } from "$lib/models/Field.svelte";
	import { EditorStateEnum } from "$lib/models/EditorStateEnum";
	import { idxToChar } from "$lib/models/TumblerIdx";

	interface Props {
		field: Field;
		editorState: EditorStateEnum;
	}
	let { field, editorState }: Props = $props();

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
		button?.focus();
	});

	function moveHorIdxLeft() {
		let newValue = horizontalSelectionIndex;
		for (let i = 0; i < 2; i++) {
			newValue--;
			// skipping self
			if (newValue === field.selectedTumblerIdx) {
				newValue--;
			}
			if (newValue >= 0) {
				break;
			}
			newValue = field.nTumblers;
			field.selectPrevTumbler();
		}

		horizontalSelectionIndex = newValue!;
	}

	function moveHorIdxRight() {
		let newValue = horizontalSelectionIndex;
		for (let i = 0; i < 2; i++) {
			newValue++;
			if (newValue === field.selectedTumblerIdx) {
				newValue++;
			}
			if (newValue < field.nTumblers) {
				break;
			}
			newValue = -1;
			field.selectNextTumbler();
		}
		horizontalSelectionIndex = newValue;
	}

	const isMobile = new MediaQuery("(width < 66ch)");
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
				if (horizontalSelectionIndex === field.selectedTumblerIdx) {
					field.selectPrevTumbler();
				}
				break;
			}
			case "ArrowDown":
			case "s":
			case "j": {
				field.selectNextTumbler();
				if (horizontalSelectionIndex === field.selectedTumblerIdx) {
					field.selectNextTumbler();
				}
				break;
			}
			case "ArrowLeft":
			case "a":
			case "h": {
				moveHorIdxLeft();
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				moveHorIdxRight();
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
								disabled={editorState !== EditorStateEnum.lockCreation}
								title={editorState !== EditorStateEnum.lockCreation
									? "Switch to lock editing mode to modify"
									: undefined}
								onclick={(e) => {
									field.selectedTumblerIdx = idx;
									horizontalSelectionIndex = depIdx;
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
		{#if isMobile.current}
			tap to modify
		{:else}
			click to toggle ,<br /> ctrl+click backwards
		{/if}
	</small>
</div>

<button
	type="button"
	disabled={editorState !== EditorStateEnum.lockCreation}
	title={editorState !== EditorStateEnum.lockCreation
		? "Switch to lock editing mode to modify"
		: undefined}
	onclick={() => field.clearDependencies()}>Clear Dependencies</button
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
		--size: var(--pin-size);
		width: var(--size);
		height: var(--size);
		position: relative;
		/* on a single column mobile view we don't care about aliging a cell with 
     * a tumbler veritcally, but we want to give sufficient click area */
		@media (width < 66ch) {
			--size: calc(var(--pin-size) * 1.6);
		}
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
		&:focus {
			outline: 2px solid var(--clr-hl);
		}
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
