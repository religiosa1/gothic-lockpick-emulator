import { Field } from '$lib/models/Field.svelte';
import { Tumbler } from '$lib/models/Tumbler.svelte';
import type { TumblerIdx } from '$lib/models/TumblerIdx';

export interface PickledField {
	_type: 'Field';
	tumblerWidth: number;
	tumblerRow: number;
	tumblerPositions: number[];
	dependencies: Record<TumblerIdx, Array<[idx: TumblerIdx, expr: number]>>;
}

export function pickle(field: Field): PickledField {
	const dependencies: Record<TumblerIdx, Array<[TumblerIdx, number]>> = {};
	for (let i = 0; i < field.dependencies.length; i++) {
		dependencies[i] = field.dependencies[i]
			.map((expression, idx) => [idx, expression] satisfies [TumblerIdx, number])
			.filter(([, expression]) => expression != 0);
	}

	return {
		_type: 'Field',
		tumblerWidth: field.tumblerWidth,
		tumblerRow: field.tumblerRow,
		tumblerPositions: field.tumblers.map((t) => t.currentPosition),
		dependencies
	};
}

export function unpickle(pickled: PickledField): Field {
	const field = new Field();
	if (pickled['_type'] !== 'Field') {
		throw new Error("Doesn't look to be a field that can be parsed");
	}
	field.nTumblers = pickled.tumblerPositions.length;
	field.tumblerWidth = pickled.tumblerWidth;
	field.tumblerRow = pickled.tumblerRow;

	for (const [idx, deps] of Object.entries(pickled.dependencies)) {
		for (const [depIdx, expr] of deps) {
			field.dependencies[+idx][depIdx] = expr;
		}
	}

	for (let i = 0; i < field.nTumblers; i++) {
		field.tumblers[i] = new Tumbler(pickled.tumblerPositions[i]);
	}

	return field;
}
