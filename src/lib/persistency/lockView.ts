import { Field } from "$lib/models/Field.svelte";
import * as pickledField from "./PickledField";

const LS_KEY = "current_lock_state";

interface PickledLockView {
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

export function saveLockView(state: UnpickledLockView): void {
	const pickledState = pickleView(state);
	localStorage.setItem(LS_KEY, JSON.stringify(pickledState));
	console.log("Saved current state");
}

export function restoreFromJson(jsonValue: string): UnpickledLockView {
	const parsed = JSON.parse(jsonValue) as PickledLockView;
	if (typeof parsed !== "object") {
		throw new Error(
			"expecting a json string containing an object with representation " +
				`of lock view, got ${typeof parsed} instead`
		);
	}
	const field = pickledField.unpickle(parsed.field);
	if (typeof parsed.lockName !== "string") {
		parsed.lockName = "Unnamed Lock";
	}
	return { field, lockName: parsed.lockName };
}

export function tryRestoreLockView(): UnpickledLockView {
	try {
		const lsStr = localStorage.getItem(LS_KEY);
		if (!lsStr) {
			return makeDefaultState();
		}
		const state = restoreFromJson(lsStr);
		console.log("Restored saved lock view");
		return state;
	} catch (err) {
		console.error("Error restoring old lock view", err);
	}
	return makeDefaultState();
}

function makeDefaultState(): UnpickledLockView {
	return {
		field: new Field(),
		lockName: "Unnamed Lock",
	};
}
