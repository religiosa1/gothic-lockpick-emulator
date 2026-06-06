<script lang="ts">
	import TumblerView from '$lib/TumblerView.svelte';
	import { idxToChar } from '$lib/models/TumblerIdx';
	import { saveLockView, tryRestoreLockView } from '$lib/persistency/lockView';

	const savedState = tryRestoreLockView();
	const field = savedState.field;

	let lockName = $state(savedState.lockName);

	function save() {
		saveLockView({ field, lockName });
	}

	let lockViewEl: HTMLUListElement;
</script>

<h1>Gothic Lockpicking Emulator</h1>

<svelte:document
	onkeydown={(e) => {
		// preventing tumblers moving on input to the header and such --
		// not processing click events by early return
		if (
			document.activeElement !== document.body &&
			document.activeElement !== lockViewEl &&
			!lockViewEl?.contains(document.activeElement)
		) {
			return;
		}
		switch (e.key) {
			case 'ArrowUp':
			case 'w':
			case 'k': {
				field.selectPrevTumbler();
				break;
			}
			case 'ArrowDown':
			case 's':
			case 'j': {
				field.selectNextTumbler();
				break;
			}
			case 'ArrowLeft':
			case 'a':
			case 'h': {
				field.moveTumbler(field.selectedTumblerIdx, 1);
				break;
			}
			case 'ArrowRight':
			case 'd':
			case 'l': {
				field.moveTumbler(field.selectedTumblerIdx, -1);
				break;
			}
		}
	}}
/>

<h2 contenteditable bind:textContent={lockName}></h2>

<section class="tumblers">
	<h3>Lock View</h3>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_autofocus -->
	<ul
		bind:this={lockViewEl}
		tabindex="0"
		class="tumblers-list"
		data-field-width={(field.tumblerWidth - 1) * 2 + 1}
	>
		{#each field.tumblers as tumbler, idx}
			{@const depExpression = field.dependencies[field.selectedTumblerIdx][idx]}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				class="tumblers-list__item"
				class:selected={idx === field.selectedTumblerIdx}
				class:dep-neg={depExpression < 0}
				class:dep-pos={depExpression > 0}
				onclick={() => (field.selectedTumblerIdx = idx)}
			>
				<TumblerView {tumbler} width={field.tumblerWidth} targetRow={field.tumblerRow} />
			</li>
		{/each}
	</ul>
	<small>use arrow keys, wasd or hjkl for modifying</small>
</section>

<section class="dependencies">
	<h3>Dependecies table</h3>

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
</section>

<button onclick={() => field.reset()}>Reset</button>
<button onclick={save} type="button">Save Lock</button>

<style>
	:root {
		--pin-width: 1rem;
		--clr-neg: red;
		--clr-pos: blue;
		--clr-hl: green;
	}
	.tumblers-list {
		counter-reset: tumblers;
		display: block;
		width: max-content;
		--field-width: attr(data-field-width type(<number>), 0);
		width: calc(var(--pin-width) * var(--field-width));
		margin: 0;
		padding: 0 var(--pin-width);
		list-style: none;
	}
	.tumblers-list__item {
		position: relative;
		margin: 1px 0;
		&::before {
			counter-increment: tumblers;
			position: absolute;
			content: counter(tumblers, upper-alpha);
			inset: 0;
			right: auto;
			left: calc(var(--pin-width) * -1);
		}
	}
	.tumblers-list__item.dep-neg {
		background: hwb(from var(--clr-neg) h w b / 0.12);
	}
	.tumblers-list__item.dep-pos {
		background: hwb(from var(--clr-pos) h w b / 0.12);
	}
	.tumblers-list__item.selected {
		outline-color: var(--clr-hl);
		outline: 2px solid;
		background: hwb(from var(--clr-hl) h w b / 0.06);
	}
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
	.dep-pos {
		color: var(--clr-pos);
	}
	.dep-neg {
		color: var(--clr-neg);
	}
	.selected {
		color: var(--clr-hl);
	}
</style>
