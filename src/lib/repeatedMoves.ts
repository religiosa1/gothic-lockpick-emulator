/**
 * @file detection of repeated moves
 *
 * Detects repeated move sequences via Re-Pair grammar compression, so the UI can
 * color-code recurring patterns in a solution.
 *
 * Re-Pair: repeatedly replace the most frequent adjacent symbol pair with a new
 * rule, until no pair repeats. The resulting grammar is a hierarchical,
 * non-overlapping decomposition — every position belongs to exactly one rule at a
 * given nesting level, which maps cleanly onto non-overlapping color spans.
 */

import { Move } from "./models/Move";

export interface RepeatResult {
	/**
	 * Per original-move-index color group id, or null if the move is not part of a
	 * colored repeated pattern. Same id => same pattern => same color.
	 */
	groups: Array<number | null>;
	/** number of distinct pattern groups assigned */
	groupCount: number;
}

export interface RepeatOptions {
	/**
	 * Minimum "moves saved" for a pattern to be colored, where
	 * saved = patternLength * (occurrences - 1).
	 */
	minSaved?: number;
	/** Cap on number of distinct colored patterns (palette size). */
	maxGroups?: number;
}

/**
 * Find repeated move sub-sequences worth highlighting.
 *
 * Returns, for each move index, a stable group id (or null) such that all
 * occurrences of the same repeated pattern share an id. Largest colorable block
 * wins: a position is painted by its outermost qualifying rule.
 */
export function findRepeatedMoves(
	moves: Move[],
	{ minSaved = 4, maxGroups = 8 }: RepeatOptions = {}
): RepeatResult {
	if (moves.length < 2) {
		return { groups: new Array(moves.length).fill(null), groupCount: 0 };
	}
	const grammar = rePair(moves);
	const getGrammarSymbolLength = makeGetGrammarSymbolLength();
	const occurrenceCounts = makeOccurrencesCountMap(grammar);
	const saved = (r: Rule) => getGrammarSymbolLength(r) * ((occurrenceCounts.get(r) ?? 0) - 1);

	// Rules that clear the savings threshold, best first.
	const colorable = grammar.rules
		.filter((r) => (occurrenceCounts.get(r) ?? 0) >= 2 && saved(r) >= minSaved)
		.sort((a, b) => saved(b) - saved(a) || getGrammarSymbolLength(b) - getGrammarSymbolLength(a))
		.slice(0, maxGroups);

	const groupOf = new Map<Rule, number>();
	colorable.forEach((r, i) => groupOf.set(r, i));

	const groups = new Array<number | null>(moves.length).fill(null);

	// Walk the top sequence, painting the outermost rule that has a color and
	// descending only when the current symbol isn't itself colored.
	const paint = (symbol: GrammarSymbol, start: number): void => {
		if (symbol instanceof Move) return; // terminal, leave null
		const group = groupOf.get(symbol);
		if (group !== undefined) {
			const end = start + getGrammarSymbolLength(symbol);
			for (let i = start; i < end; i++) groups[i] = group;
			return;
		}
		paint(symbol.left, start);
		paint(symbol.right, start + getGrammarSymbolLength(symbol.left));
	};

	let offset = 0;
	for (const symbol of grammar.top) {
		paint(symbol, offset);
		offset += getGrammarSymbolLength(symbol);
	}

	// A colorable rule nested inside a larger painted rule never reaches the
	// output. Compact to only the groups actually used, numbered by first
	// appearance, so groupCount is truthful and ids are dense for the palette.
	const remap = new Map<number, number>();
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		if (group === null) continue;
		let dense = remap.get(group);
		if (dense === undefined) {
			dense = remap.size;
			remap.set(group, dense);
		}
		groups[i] = dense;
	}

	return { groups, groupCount: remap.size };
}

//==============================================================================
// Implementation

/**
 * A grammar symbol: either a literal {@link Move} (a terminal) or a {@link Rule}
 * standing for a sequence. Terminals are compared by Move.isSame, rules by
 * reference — see {@link symbolsEqual}.
 */
type GrammarSymbol = Move | Rule;

/**
 * A grammar rule: a stand-in for the pair (left, right). The SAME rule object
 * appears at every position it occurs — that shared reference is what makes a
 * repeat a repeat. `id` is only for map keys / grouping.
 */
class Rule {
	constructor(
		public id: number,
		public left: GrammarSymbol,
		public right: GrammarSymbol
	) {}
}

class RuleFactory {
	lastId = 0;
	newRule(left: GrammarSymbol, right: GrammarSymbol): Rule {
		return new Rule(this.lastId++, left, right);
	}
}

/**
 * Symbol equality: rules by reference (the same rule object is reused at every
 * occurrence), terminals by Move.isSame. Mixed kinds are never equal.
 */
function symbolsEqual(a: GrammarSymbol, b: GrammarSymbol): boolean {
	if (a instanceof Rule || b instanceof Rule) {
		return a === b;
	}
	return a.isSame(b);
}

/**
 * Stable string key for a symbol, used to count pairs. Terminals key on the same
 * fields Move.isSame compares (idx + direction), so isSame moves share a key.
 */
function symbolKey(symbol: GrammarSymbol): string {
	return symbol instanceof Rule ? `r${symbol.id}` : `t${symbol.idx}:${symbol.direction}`;
}

interface Grammar {
	/** the compressed top-level sequence */
	top: GrammarSymbol[];
	/** rules in creation order (children always precede the rules that use them) */
	rules: Rule[];
}

/** Build a Re-Pair grammar from a move sequence. */
function rePair(moves: Move[]): Grammar {
	const rules: Rule[] = [];
	let seq: GrammarSymbol[] = moves.slice();
	const ruleFactory = new RuleFactory();

	for (;;) {
		// Count adjacent pairs. Only equal symbols (a,a,a,...) can overlap; for those
		// we count greedily so the count matches what the replace pass can actually
		// consume (a,a,a -> 1, not 2). Distinct pairs never overlap.
		const counts = new Map<string, { a: GrammarSymbol; b: GrammarSymbol; n: number }>();
		const consumedRight = new Map<string, number>();
		for (let i = 0; i + 1 < seq.length; i++) {
			const a = seq[i];
			const b = seq[i + 1];
			const key = `${symbolKey(a)},${symbolKey(b)}`;
			const equal = symbolsEqual(a, b);
			if (equal && consumedRight.get(key) === i) {
				continue; // i already taken
			}
			const entry = counts.get(key);
			if (entry) {
				entry.n++;
			} else counts.set(key, { a, b, n: 1 });
			if (equal) {
				consumedRight.set(key, i + 1);
			}
		}

		// Pick the most frequent pair; need >= 2 to be worth a rule.
		let best: { a: GrammarSymbol; b: GrammarSymbol; n: number } | undefined;
		for (const entry of counts.values()) {
			if (entry.n >= 2 && (!best || entry.n > best.n)) {
				best = entry;
			}
		}
		if (!best) break;

		const rule = ruleFactory.newRule(best.a, best.b);
		rules.push(rule);

		// Replace all non-overlapping left-to-right occurrences of the pair.
		const next: GrammarSymbol[] = [];
		for (let i = 0; i < seq.length; i++) {
			const curSymbol = seq[i];
			const nextSymbol = seq.at(i + 1);
			if (nextSymbol && symbolsEqual(curSymbol, best.a) && symbolsEqual(nextSymbol, best.b)) {
				next.push(rule);
				i++; // consume both
			} else {
				next.push(seq[i]);
			}
		}
		seq = next;
	}

	return { top: seq, rules };
}

/** Expansion length (in terminals) of a symbol, memoized across the grammar. */
function makeGetGrammarSymbolLength(): (s: GrammarSymbol) => number {
	const cache = new Map<Rule, number>();
	const getLength = (symbol: GrammarSymbol): number => {
		if (symbol instanceof Move) {
			return 1;
		}
		const cached = cache.get(symbol);
		if (cached !== undefined) {
			return cached;
		}
		const length = getLength(symbol.left) + getLength(symbol.right);
		cache.set(symbol, length);
		return length;
	};
	return getLength;
}

/** Total occurrence count of every rule across the full expansion. */
function makeOccurrencesCountMap(grammar: Grammar): Map<Rule, number> {
	const counts = new Map<Rule, number>();
	for (const symbol of grammar.top) {
		if (symbol instanceof Rule) {
			counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
		}
	}
	// Rules created later are the outer ones; iterate in reverse so a rule's own
	// count is finalized before we push it down to its children.
	for (let i = grammar.rules.length - 1; i >= 0; i--) {
		const rule = grammar.rules[i];
		const count = counts.get(rule) ?? 0;
		if (count === 0) continue;
		if (rule.left instanceof Rule) {
			counts.set(rule.left, (counts.get(rule.left) ?? 0) + count);
		}
		if (rule.right instanceof Rule) {
			counts.set(rule.right, (counts.get(rule.right) ?? 0) + count);
		}
	}
	return counts;
}
