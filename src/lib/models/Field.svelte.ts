import { Tumbler } from './Tumbler.svelte';
import type { TumblerIdx } from './TumblerIdx';

export class Field {
	nTumblers = 6;
	tumblerWidth = 7;
	tumblerRow = 3; // zero-based

	selectedTumblerIdx = $state<TumblerIdx>(0);

	tumblers = $state<Tumbler[]>([]);
	dependencies = $state<number[][]>([]);

	constructor() {
		this.tumblers = Array.from({ length: this.nTumblers }, () => new Tumbler(this.tumblerRow));
		this.dependencies = Array.from({ length: this.nTumblers }, () =>
			new Array(this.nTumblers).fill(0)
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

	moveTumbler(idx: TumblerIdx, direction: number): TumblerIdx[] {
		direction = Math.min(Math.max(direction, -1), 1);

		const deps = this.dependencies[idx];
		const newPositions = this.tumblers.map((t, i) => {
			if (i === idx) {
				return t.currentPosition + direction;
			}
			return t.currentPosition + deps[i] * direction;
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
}
