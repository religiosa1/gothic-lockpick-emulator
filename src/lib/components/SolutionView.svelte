<script lang="ts">
	import GlobalKeyHandler from "$lib/components/GlobalKeyHandler.svelte";
	import type { Field } from "$lib/models/Field.svelte";
	import { EditorStateEnum } from "$lib/models/EditorStateEnum";
	import type { SolutionManager } from "$lib/models/SolutionManager.svelte";
	import Toggle from "./Toggle.svelte";

	interface Props {
		field: Field;
		solutionManager: SolutionManager;
		lockViewEl: HTMLUListElement | undefined;
	}
	let { lockViewEl, solutionManager, field }: Props = $props();

	let solutionHistoryEl = $state<HTMLUListElement>();
	$effect(() => {
		const idx = solutionManager.currentHistoryIdx;
		solutionHistoryEl?.querySelector(`.solution-list__item[data-idx="${idx}"]`)?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	});

	let autosolverError = $state<string>();

	async function solve() {
		autosolverError = undefined;
		try {
			await solutionManager.solve();
			// moving the focus to the solution manager, so you can immediately go
			// through it
			solutionHistoryEl?.focus();
		} catch (error) {
			autosolverError = error instanceof Error ? error.message : String(error);
		}
	}
</script>

<GlobalKeyHandler
	onPrevTumbler={() => field.selectPrevTumbler()}
	onNextTumbler={() => field.selectNextTumbler()}
	currentlySelectedIdx={field.selectedTumblerIdx}
	includedElements={[lockViewEl].filter((i) => i != null)}
	onMoveRequested={(m) => solutionManager.tryMove(m)}
/>

<label class="toggle-label">
	Editing Lock
	<Toggle
		disabled={solutionManager.editorState === EditorStateEnum.autoSolving}
		checked={solutionManager.editorState === EditorStateEnum.solving}
		indeterminate={solutionManager.editorState !== EditorStateEnum.solving &&
			solutionManager.editorState !== EditorStateEnum.lockCreation}
		onclick={(e) => {
			const newValue =
				solutionManager.editorState === EditorStateEnum.solving
					? EditorStateEnum.lockCreation
					: EditorStateEnum.solving;
			if (newValue === EditorStateEnum.lockCreation) {
				if (
					solutionManager.movesHistory.length &&
					!confirm(
						"You will lose the moves you made and go back to editing the lock. Are you sure?"
					)
				) {
					e.preventDefault();
					return;
				}
				autosolverError = undefined;
			}
			solutionManager.editorState = newValue;
		}}
	/>
	Solving
</label>

<button
	onclick={() => solutionManager.reset(true)}
	type="button"
	disabled={solutionManager.nonSolvingState || !solutionManager.movesHistory.length}
>
	Reset
</button>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<ul
	bind:this={solutionHistoryEl}
	class="solution-list"
	tabindex="0"
	onkeydown={(e) => {
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "k": {
				solutionManager.prevState();
				break;
			}
			case "ArrowDown":
			case "s":
			case " ":
			case "j": {
				solutionManager.nextState();
				break;
			}
			// TODO: replace that with tinykeys and the proper gg
			case "g": {
				solutionManager.reset(false);
				break;
			}
			case "G": {
				solutionManager.lastState();
				break;
			}
		}
	}}
>
	{#if solutionManager.editorState !== EditorStateEnum.lockCreation}
		<li
			class="solution-list__item initial"
			class:current={solutionManager.currentHistoryIdx === -1}
		>
			<button class="history-state-btn" type="button" onclick={() => solutionManager.reset(false)}>
				Initial state
			</button>
		</li>
	{/if}
	{#each solutionManager.movesHistory as state, idx}
		<li
			data-idx={idx}
			class="solution-list__item"
			class:undone={idx > solutionManager.currentHistoryIdx}
			class:current={idx === solutionManager.currentHistoryIdx}
			class:solved={state.state === solutionManager.solvedState}
			class:repeated={idx > 0 && state.move.isSame(solutionManager.movesHistory[idx - 1].move)}
		>
			<button
				class="history-state-btn"
				type="button"
				onclick={() => {
					solutionManager.restoreState(idx);
					// restore state makes the current clicked button disabled, so this move focus to the body
					// By manually focusing on the ul we can do proper keyboard nav through the table
					solutionHistoryEl?.focus();
				}}
				disabled={solutionManager.nonSolvingState || idx === solutionManager.currentHistoryIdx}
			>
				{state.move.toString()}
			</button>
		</li>
	{/each}
</ul>

{#if solutionManager.editorState !== EditorStateEnum.autoSolving}
	<button onclick={solve} type="button">Auto-Solve</button>
	{#if autosolverError}
		<p class="error">{autosolverError}</p>
	{/if}
{:else}
	<button disabled type="button">Thinking on solution...</button>
{/if}

<style>
	.solution-list {
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: steps;
	}
	.solution-list__item {
		margin: 0.2em 0;
		padding: 0;
		/* to have some breathing room during the autoscroll on keyboard nav */
		scroll-margin-block: 4em;
		&::before {
			content: counter(steps) ". ";
			display: inline-block;
			text-align: right;
			margin-right: 0.3em;
			min-width: 3.2ch;
		}
		&::after {
			content: "";
			counter-increment: steps;
		}
	}
	.solution-list__item.initial::before {
		content: "";
	}
	.solution-list__item:not(.repeated) {
		counter-reset: repeated-steps;
		counter-increment: repeated-steps;
	}
	.solution-list__item.repeated .history-state-btn {
		margin-left: 0.5em;
	}
	.repeated .history-state-btn::after {
		counter-increment: repeated-steps;
		content: " ×" counter(repeated-steps);
	}
	.undone {
		opacity: 0.6;
	}
	.current {
		position: relative;
		font-weight: bold;
	}
	.solved {
		color: var(--clr-pos);
	}
	.current::after {
		content: "▸";
		position: absolute;
		top: 0;
		bottom: 0;
		left: -1em;
	}
	.history-state-btn {
		all: unset;
		cursor: pointer;
	}

	.toggle-label {
		display: inline-flex;
		align-items: center;
	}
</style>
