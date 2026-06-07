import type { TumblerIdx } from "./TumblerIdx";
export const FAILED_TUMBLER_MOVE_EVENT_NAME = "failed-tumbler-move";

export interface FailedTumblerMoveEventDetail {
	indexes: TumblerIdx[];
}

declare global {
	interface DocumentEventMap {
		[FAILED_TUMBLER_MOVE_EVENT_NAME]: CustomEvent<FailedTumblerMoveEventDetail>;
	}
}
