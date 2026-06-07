import { Move } from "./Move";
import { Tumbler } from "./Tumbler.svelte";
import type { TumblerIdx } from "./TumblerIdx";

export class Field {
	tumblerWidth = 7;
	tumblerRow = 3; // zero-based
	tumblers = $state<Tumbler[]>([]);
	dependencies = $state<number[][]>([]);

	#nTumblers = $state(6);
	get nTumblers() {
		return this.#nTumblers;
	}
	set nTumblers(v: number) {
		if (!Number.isInteger(v)) {
			throw new TypeError("nTumblers must be an int");
		}
		if (v <= 0 || v > 9) {
			throw new RangeError("nTumblers must be between 0..10");
		}
		const old = this.#nTumblers;
		this.#nTumblers = v;
		if (old < v) {
			for (let i = old; i < v; i++) {
				// Extending length of old deps arrays
				for (const dep of this.dependencies) {
					dep.push(0);
				}
				this.tumblers.push(new Tumbler(this.tumblerRow));
				const depArray = new Array(this.#nTumblers).fill(0);
				this.dependencies.push(depArray);
			}
		} else if (old > v) {
			this.tumblers.length = v;
		}
	}

	selectedTumblerIdx = $state<TumblerIdx>(0);

	constructor(nTumblers = 6) {
		this.#nTumblers = nTumblers;
		this.tumblers = Array.from({ length: this.#nTumblers }, () => new Tumbler(this.tumblerRow));
		this.dependencies = Array.from({ length: this.#nTumblers }, () =>
			new Array(this.#nTumblers).fill(0)
		);
	}

	reset() {
		for (const tumbler of this.tumblers) {
			tumbler.reset();
		}
	}

	clearDependencies() {
		this.dependencies.forEach((dep) => dep.fill(0));
	}

	moveTumbler(move: Move): TumblerIdx[] {
		const deps = this.dependencies[move.idx];
		const newPositions = this.tumblers.map((t, i) => {
			if (i === move.idx) {
				return t.currentPosition + move.direction;
			}
			return t.currentPosition + deps[i] * move.direction;
		});

		const blockingTumblerIdxs: TumblerIdx[] = [];
		for (let i = 0; i < this.tumblers.length; i++) {
			const pos = newPositions[i];
			if (pos < 0 || pos >= this.tumblerWidth) {
				blockingTumblerIdxs.push(i);
			}
		}

		if (!blockingTumblerIdxs.length) {
			for (let i = 0; i < this.tumblers.length; i++) {
				this.tumblers[i].currentPosition = newPositions[i];
			}
		}
		return blockingTumblerIdxs;
	}

	selectPrevTumbler() {
		let newValue = this.selectedTumblerIdx - 1;
		if (newValue < 0) {
			newValue = this.#nTumblers - 1;
		}
		this.selectedTumblerIdx = newValue;
	}

	selectNextTumbler() {
		let newValue = this.selectedTumblerIdx + 1;
		if (newValue >= this.#nTumblers) {
			newValue = 0;
		}
		this.selectedTumblerIdx = newValue;
	}

	/** Capture current tumblers state as just an array of their positions */
	snapshot(): TumblerIdx[] {
		return this.tumblers.map((t) => t.currentPosition);
	}
}
