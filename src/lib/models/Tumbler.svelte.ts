import type { TumblerIdx } from './TumblerIdx';

export class Tumbler {
	startingPosition = $state<TumblerIdx>(0);
	currentPosition = $state<TumblerIdx>(0);

	constructor(startingPos: number) {
		this.startingPosition = startingPos;
		this.currentPosition = startingPos;
	}

	reset() {
		this.currentPosition = this.startingPosition;
	}
}
