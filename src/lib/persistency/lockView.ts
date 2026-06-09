import {
	pickleView,
	unpickleView,
	type PickledLockView,
	type UnpickledLockView,
} from "./PickledLockView";

const LS_KEY = "current_lock_state";

export function saveLockView(state: UnpickledLockView): void {
	const pickledState = pickleView(state);
	localStorage.setItem(LS_KEY, JSON.stringify(pickledState));
	console.log("Saved current state");
}

export function deleteLockView(): UnpickledLockView {
	localStorage.removeItem(LS_KEY);
	console.log("Deleted current state");
	return makeDefaultState();
}

export function restoreFromJson(jsonValue: string): UnpickledLockView {
	const parsed = JSON.parse(jsonValue) as PickledLockView;
	return unpickleView(parsed);
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

// for the default lock, to make it slightly more apparent for a first time-user,
// let's just have an existing lock from a game, Scatty's chest makes sense, as
// it's the first quest-related one.
const defaultLockView: PickledLockView = {
	lockName: "Scatty's chest",
	field: {
		_type: "Field",
		tumblerWidth: 7,
		tumblerRow: 3,
		tumblerPositions: [6, 0, 1, 2, 5],
		dependencies: {
			"0": [],
			"1": [
				[0, -1],
				[2, -1],
				[3, 1],
			],
			"2": [[0, -1]],
			"3": [[0, 1]],
			"4": [[1, 1]],
		},
	},
};

function makeDefaultState(): UnpickledLockView {
	return unpickleView(defaultLockView);
}
