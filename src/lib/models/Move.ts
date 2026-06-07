import { directionToString, type DirectionEnum } from "./DirectionEnum";
import { idxToChar, type TumblerIdx } from "./TumblerIdx";

export class Move {
	readonly idx: TumblerIdx;
	readonly direction: DirectionEnum;

	constructor(index: TumblerIdx, direction: DirectionEnum) {
		this.idx = index;
		this.direction = direction;
	}

	isSame(other: Move): boolean {
		if (this.idx !== other.idx) {
			return false;
		}
		return this.direction === other.direction;
	}

	isOpposite(other: Move): boolean {
		if (this.idx !== other.idx) {
			return false;
		}
		// technically we could've just !==, but let's overengineer everything
		return -1 * this.direction === other.direction;
	}

	toString(): string {
		return `Move(${idxToChar(this.idx)}, ${directionToString(this.direction)})`;
	}
}
