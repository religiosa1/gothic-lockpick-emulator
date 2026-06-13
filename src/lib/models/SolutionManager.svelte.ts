import { Solver } from "$lib/Solver";
import { dispatchFailedMoveEvent } from "./events/FailedMoveEvent";
import type { Field } from "./Field.svelte";
import { EditorStateEnum } from "./enums/EditorStateEnum";
import type { IMoveState } from "./IMoveState";
import type { Move } from "./Move";
import { SnapshotPacker } from "./SnapshotPacker";

export class SolutionManager {
	movesHistory = $state<IMoveState[]>([]);

	/** Offset in move state from history -- during normal operations must be on 0,
	 * after undo it decrements by one, redo increments it back */
	historyOffset = $state(0);

	currentHistoryIdx = $derived.by(() => {
		return this.movesHistory.length - Math.max(this.historyOffset, 0) - 1;
	});

	#editorState = $state<EditorStateEnum>(EditorStateEnum.lockCreation);
	get editorState() {
		return this.#editorState;
	}
	set editorState(v: EditorStateEnum) {
		if (v === EditorStateEnum.lockCreation) {
			this.reset(true);
		} else if (
			v === EditorStateEnum.solving &&
			this.#editorState === EditorStateEnum.lockCreation
		) {
			this.field.saveSnapshotAsInitialState();
		}
		this.#editorState = v;
	}

	#packer = $derived.by(
		() =>
			new SnapshotPacker({
				nTumblers: this.field.nTumblers,
				tumblerWidth: this.field.tumblerWidth,
			})
	);
	get packer() {
		return this.#packer;
	}

	#solvedState = $derived.by(() =>
		this.packer.pack(new Array(this.field.nTumblers).fill(this.field.tumblerRow))
	);
	get solvedState() {
		return this.#solvedState;
	}

	nonSolvingState = $derived(this.editorState !== EditorStateEnum.solving);

	private get field() {
		return this.fieldGetter();
	}

	constructor(private fieldGetter: () => Field) {}

	/** @param idx history state index */
	restoreState(idx: number) {
		if (!Number.isInteger(idx) || idx < 0 || idx >= this.movesHistory.length) {
			throw new Error(
				`Invalid index value ${idx} (must be an int between 0..${this.movesHistory.length})`
			);
		}
		const moveState = this.movesHistory[idx];
		const snapshot = this.packer.unpack(moveState.state);
		this.historyOffset = this.movesHistory.length - idx - 1;
		this.field.setState(snapshot);
		this.field.selectedTumblerIdx = moveState.move.idx;
	}

	tryMove(move: Move) {
		if (this.editorState === EditorStateEnum.autoSolving) {
			return;
		}
		const failed = this.field.moveTumbler(move);
		if (failed.length) {
			dispatchFailedMoveEvent(failed);
			return;
		}
		// in lock creation view every move is a move for initial state, so the lock
		// can be properly pickled
		if (this.editorState === EditorStateEnum.lockCreation) {
			this.field.saveSnapshotAsInitialState();
		}

		if (this.nonSolvingState) {
			return;
		}
		// undo check -- verifying that the move isn't a cancellation of a previous one
		const existingState =
			this.currentHistoryIdx >= 0 ? this.movesHistory.at(this.currentHistoryIdx) : undefined;
		if (existingState && move.isOpposite(existingState.move)) {
			this.historyOffset++;
			return;
		}
		// redo check
		if (this.historyOffset > 0) {
			const nextState = this.movesHistory.at(this.currentHistoryIdx + 1);
			if (nextState && move.isSame(nextState.move)) {
				this.historyOffset--;
				return;
			}
		}

		// Trimming the old redo path if any.
		if (this.historyOffset !== 0) {
			this.movesHistory.length -= Math.max(this.historyOffset, 0);
			this.historyOffset = 0;
		}

		const newMoveState: IMoveState = {
			move,
			state: this.packer.pack(this.field.snapshot()),
		};
		this.movesHistory.push(newMoveState);
	}

	reset(clearMovesHistory: boolean) {
		this.field.reset();
		if (clearMovesHistory) {
			this.historyOffset = -1;
			this.movesHistory.length = 0;
		} else {
			this.historyOffset = this.movesHistory.length || -1;
		}
	}

	prevState() {
		if (this.currentHistoryIdx > 0) {
			this.restoreState(this.currentHistoryIdx - 1);
		} else {
			this.reset(false);
		}
	}

	nextState() {
		if (this.currentHistoryIdx < this.movesHistory.length - 1) {
			this.restoreState(this.currentHistoryIdx + 1);
		}
	}

	lastState() {
		if (this.movesHistory.length) {
			this.restoreState(this.movesHistory.length - 1);
		}
	}

	async solve() {
		const startTs = performance.now();
		const solver = new Solver({
			nTumblers: this.field.nTumblers,
			tumblerWidth: this.field.tumblerWidth,
			tumblerRow: this.field.tumblerRow,
			dependencies: this.field.dependencies,
		});
		this.editorState = EditorStateEnum.autoSolving;
		try {
			await solver.build();
			const builtTs = performance.now();
			const solutionSteps = solver.solve(this.field.snapshot());
			const endTs = performance.now();
			console.log(solutionSteps?.map((m) => m.move.toString()).join("\n") ?? "unsolvable");
			console.log(
				`Solved in ${endTs - startTs}, ` +
					`solution graph built in ${builtTs - startTs}, ` +
					`containing ${solver.size} possible steps`
			);
			if (solutionSteps?.length) {
				if (this.historyOffset > 0) {
					this.movesHistory.length -= this.historyOffset;
					this.historyOffset = 0;
				}
				for (const state of solutionSteps) {
					this.movesHistory.push(state);
				}
				this.historyOffset += solutionSteps.length;
				// moving the focus to the solution manager, so you can immediately go
				// through it
			} else if (solutionSteps == null) {
				throw new Error("The lock isn't solvable, the math says so");
			} else {
				throw new Error("It's already solved");
			}
		} finally {
			this.editorState = EditorStateEnum.solving;
		}
	}
}
