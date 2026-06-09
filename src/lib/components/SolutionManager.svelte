<script lang="ts">
	import GlobalKeyHandler from "$lib/components/GlobalKeyHandler.svelte";
	import { FAILED_TUMBLER_MOVE_EVENT_NAME } from "$lib/models/FailedMoveEvent";
	import type { Field } from "$lib/models/Field.svelte";
	import { GlobalEditorStateEnum } from "$lib/models/GlobalEditorStateEnum";
	import type { IMoveState } from "$lib/models/IMoveState";
	import type { Move } from "$lib/models/Move";
	import { SnapshotPacker } from "$lib/models/SnapshotPacker";
	import { Solver } from "$lib/Solver";
	import Toggle from "./Toggle.svelte";

	interface Props {
		field: Field;
		lockViewEl: HTMLUListElement | undefined;
		globalState: GlobalEditorStateEnum;
	}
	let { field, lockViewEl, globalState = $bindable() }: Props = $props();

	let moveStates = $state<IMoveState[]>([]);
	/** Offset in move state from history -- during normal operations must be on 0,
	 * after undo it decrementes by one, redos increment it back */
	let historyOffset = $state(0);
	let currentHistoryIdx = $derived(moveStates.length - Math.max(historyOffset, 0) - 1);

	let packer = $derived(
		new SnapshotPacker({
			nTumblers: field.nTumblers,
			tumblerWidth: field.tumblerWidth,
		})
	);
	let solvedState = $derived(packer.pack(new Array(field.nTumblers).fill(field.tumblerRow)));

	function dispatchFailedUpdatesEvent(failedIndexes: number[]): void {
		if (!failedIndexes?.length) {
			return;
		}
		const event = new CustomEvent(FAILED_TUMBLER_MOVE_EVENT_NAME, {
			detail: {
				indexes: failedIndexes,
			},
		});
		document.dispatchEvent(event);
	}

	function restoreState(idx: number) {
		if (!Number.isInteger(idx) || idx < 0 || idx >= moveStates.length) {
			throw new Error(
				`Invalid index value ${idx} (must be an int between 0..${moveStates.length})`
			);
		}
		const moveState = moveStates[idx];
		const snapshot = packer.unpack(moveState.state);
		historyOffset = moveStates.length - idx - 1;
		field.setState(snapshot);
		field.selectedTumblerIdx = moveState.move.idx;
	}

	const nonSolvingState = $derived(globalState !== GlobalEditorStateEnum.solving);

	function onMoveRequested(move: Move) {
		if (globalState === GlobalEditorStateEnum.autoSolving) {
			return;
		}
		const failed = field.moveTumbler(move);
		if (failed.length) {
			dispatchFailedUpdatesEvent(failed);
			return;
		}

		if (nonSolvingState) {
			return;
		}
		// undo check -- verifying that the move isn't a cancellation of a previous one
		const existingState = moveStates.at(currentHistoryIdx);
		if (existingState && move.isOpposite(existingState.move)) {
			historyOffset++;
			return;
		}
		// redo check
		if (historyOffset > 0) {
			const nextState = moveStates.at(currentHistoryIdx + 1);
			if (nextState && move.isSame(nextState.move)) {
				historyOffset--;
				return;
			}
		}

		// Trimming the old redo path if any.
		if (historyOffset !== 0) {
			moveStates.length -= Math.max(historyOffset, 0);
			historyOffset = 0;
		}

		const newMoveState: IMoveState = {
			move,
			state: packer.pack(field.snapshot()),
		};
		moveStates.push(newMoveState);
	}

	function reset(clearState: boolean) {
		field.reset();
		if (clearState) {
			historyOffset = -1;
			moveStates.length = 0;
		} else {
			historyOffset = moveStates.length || -1;
		}
	}

	let solitionHistoryEl = $state<HTMLUListElement>();
	let autosolverError = $state<string>();

	async function solve() {
		const startTs = performance.now();
		const solver = new Solver({
			nTumblers: field.nTumblers,
			tumblerWidth: field.tumblerWidth,
			tumblerRow: field.tumblerRow,
			dependencies: field.dependencies,
		});
		globalState = GlobalEditorStateEnum.autoSolving;
		autosolverError = undefined;
		try {
			await solver.build();
			const builtTs = performance.now();
			const solutionSteps = solver.solve(field.snapshot());
			const endTs = performance.now();
			console.log(solutionSteps?.map((m) => m.move.toString()).join("\n") ?? "unsolvable");
			console.log(
				`Solved in ${endTs - startTs}, ` +
					`solution graph built in ${builtTs - startTs}, ` +
					`containing ${solver.size} possible steps`
			);
			if (solutionSteps?.length) {
				if (historyOffset > 0) {
					moveStates.length -= historyOffset;
					historyOffset = 0;
				}
				for (const state of solutionSteps) {
					moveStates.push(state);
				}
				historyOffset += solutionSteps.length;
				// moving the focus to the solution manager, so you can immediately go
				// through it
				solitionHistoryEl?.focus();
			} else {
				autosolverError = "The lock isn't solvable, the math says so";
			}
		} catch (err) {
			console.error(err);
			const message = err instanceof Error ? err.message : String(err);
			autosolverError = `Error while solving the lock: ${message}`;
		} finally {
			globalState = GlobalEditorStateEnum.solving;
		}
	}
</script>

<GlobalKeyHandler
	{field}
	includedElements={[lockViewEl].filter((i) => i != null)}
	{onMoveRequested}
/>

<label class="toggle-label">
	Editing Lock
	<Toggle
		disabled={globalState === GlobalEditorStateEnum.autoSolving}
		checked={globalState === GlobalEditorStateEnum.solving}
		indeterminate={globalState !== GlobalEditorStateEnum.solving &&
			globalState !== GlobalEditorStateEnum.lockCreation}
		onclick={(e) => {
			const newValue =
				globalState === GlobalEditorStateEnum.solving
					? GlobalEditorStateEnum.lockCreation
					: GlobalEditorStateEnum.solving;
			if (newValue === GlobalEditorStateEnum.lockCreation) {
				if (
					moveStates.length &&
					!confirm(
						"You will lose the moves you made and go back to editing the lock. Are you sure?"
					)
				) {
					e.preventDefault();
					return;
				}
				reset(true);
				autosolverError = undefined;
			} else {
				field.saveSnapshotAsInitialState();
			}
			globalState = newValue;
		}}
	/>
	Solving
</label>

<button onclick={() => reset(true)} type="button" disabled={nonSolvingState || !moveStates.length}>
	Reset
</button>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<ul
	bind:this={solitionHistoryEl}
	class="solution-list"
	tabindex="0"
	onkeydown={(e) => {
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "k": {
				if (currentHistoryIdx > 0) {
					restoreState(currentHistoryIdx - 1);
				} else {
					reset(false);
				}
				break;
			}
			case "ArrowDown":
			case "s":
			case " ":
			case "j": {
				if (currentHistoryIdx < moveStates.length - 1) {
					restoreState(currentHistoryIdx + 1);
				}
				break;
			}
			case "G": {
				if (moveStates.length) {
					restoreState(moveStates.length - 1);
				}
				break;
			}
			// TODO: replace that with tinykeys and the proper gg
			case "g": {
				reset(false);
				break;
			}
		}
	}}
>
	{#if globalState !== GlobalEditorStateEnum.lockCreation}
		<li class="solution-list__item initial" class:current={currentHistoryIdx === -1}>
			<button class="history-state-btn" type="button" onclick={() => reset(false)}>
				Initial state
			</button>
		</li>
	{/if}
	{#each moveStates as state, idx}
		<li
			class="solution-list__item"
			class:undone={idx > currentHistoryIdx}
			class:current={idx === currentHistoryIdx}
			class:solved={state.state === solvedState}
			class:repeated={idx > 0 && state.move.isSame(moveStates[idx - 1].move)}
		>
			<button
				class="history-state-btn"
				type="button"
				onclick={() => {
					restoreState(idx);
					// restore state makes the current clicked button disabled, so this move focus to the body
					// By manually focusing on the ul we can do proper keyboard nav through the table
					solitionHistoryEl?.focus();
				}}
				disabled={nonSolvingState || idx === currentHistoryIdx}
			>
				{state.move.toString()}
			</button>
		</li>
	{/each}
</ul>

{#if globalState !== GlobalEditorStateEnum.autoSolving}
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
