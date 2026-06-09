import { Field } from "$lib/models/Field.svelte";
import * as pickledField from "./PickledField";

export interface PickledLockView {
	field: pickledField.PickledField;
	lockName: string;
}

export interface UnpickledLockView {
	field: Field;
	lockName: string;
}

export function pickleView(state: UnpickledLockView): PickledLockView {
	const pickledState: PickledLockView = {
		lockName: state.lockName,
		field: pickledField.pickle(state.field),
	};
	return pickledState;
}

export function unpickleView(view: PickledLockView): UnpickledLockView {
	if (typeof view !== "object" || view == null) {
		throw new Error(
			"expecting a lock view to be an object with representation " + `got ${typeof view} instead`
		);
	}
	const lockName =
		typeof view.lockName === "string" && view.lockName ? view.lockName : "Unnamed lock";
	return {
		lockName,
		field: pickledField.unpickle(view.field),
	};
}
