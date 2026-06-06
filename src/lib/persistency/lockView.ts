import { Field } from '$lib/models/Field.svelte';
import * as pickledField from './PickledField';

const LS_KEY = 'current_lock_state';

interface PickledLockView {
	field: pickledField.PickledField;
}

interface UnpickledLockView {
	field: Field;
}

export function saveLockView(state: UnpickledLockView): void {
	const pickledState: PickledLockView = {
		field: pickledField.pickle(state.field)
	};
	localStorage.setItem(LS_KEY, JSON.stringify(pickledState));
	console.log('Saved current state');
}

export function tryRestoreLockView(): UnpickledLockView {
	try {
		const lsStr = localStorage.getItem(LS_KEY);
		if (!lsStr) {
			return makeDefaultState();
		}
		const parsed = JSON.parse(lsStr);
		const field = pickledField.unpickle(parsed.field);
		console.log('Restored saved lock view');
		return { field };
	} catch (err) {
		console.error('Error restoring old lock view', err);
	}
	return makeDefaultState();
}

function makeDefaultState(): UnpickledLockView {
	return {
		field: new Field()
	};
}
