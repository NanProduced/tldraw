import {
	Box,
	Editor,
	TLNoteShape,
	TLShapeId,
	TLShapePartial,
	Vec,
	createShapeId,
	getColorValues,
} from '@tldraw/editor'
import { renderPlaintextFromRichText } from '../text/richText'

const STOP_WORDS = new Set([
	'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
	'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
	'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
	'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
	'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
	'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
	'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
	'hers', 'ours', 'theirs', 'what', 'which', 'who', 'whom', 'whose',
	'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
	'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
	'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
	'here', 'there', 'then', 'once', 'if', 'because', 'until', 'while',
	'although', 'though', 'after', 'before', 'since', 'during', 'without',
	'again', 'further', 'any', 'against', 'about', 'between', 'into',
	'through', 'during', 'above', 'below', 'up', 'down', 'out', 'off',
	'over', 'under', 'again', 'further', 'then', 'once', 'am',
])

export interface NoteGroup {
	color: string
	notes: TLNoteShape[]
}

export interface TFIDFResult {
	term: string
	tfidf: number
}

export type NoteSortOrder = 'time' | 'votes' | 'color'

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter((word) => word.length > 2 && !STOP_WORDS.has(word))
}

function computeTF(term: string, tokens: string[]): number {
	const count = tokens.filter((t) => t === term).length
	return count / tokens.length
}

function computeIDF(term: string, allTokens: string[][]): number {
	const docsWithTerm = allTokens.filter((tokens) => tokens.includes(term)).length
	return Math.log(allTokens.length / (1 + docsWithTerm))
}

export function extractKeywordsWithTFIDF(
	texts: string[],
	maxKeywords: number = 3
): string[][] {
	const allTokens = texts.map((text) => tokenize(text))
	const allTerms = new Set(allTokens.flat())

	const results: string[][] = []

	for (let i = 0; i < texts.length; i++) {
		const tokens = allTokens[i]
		const tfidfScores: TFIDFResult[] = []

		for (const term of allTerms) {
			if (!tokens.includes(term)) continue
			const tf = computeTF(term, tokens)
			const idf = computeIDF(term, allTokens)
			tfidfScores.push({ term, tfidf: tf * idf })
		}

		tfidfScores.sort((a, b) => b.tfidf - a.tfidf)
		results.push(tfidfScores.slice(0, maxKeywords).map((r) => r.term))
	}

	return results
}

export function groupNotesByColor(notes: TLNoteShape[]): NoteGroup[] {
	const groups: Map<string, TLNoteShape[]> = new Map()

	for (const note of notes) {
		const color = note.props.color
		if (!groups.has(color)) {
			groups.set(color, [])
		}
		groups.get(color)!.push(note)
	}

	return Array.from(groups.entries()).map(([color, notes]) => ({ color, notes }))
}

export function sortNotes(
	notes: TLNoteShape[],
	order: NoteSortOrder
): TLNoteShape[] {
	const sorted = [...notes]

	switch (order) {
		case 'time':
			sorted.sort((a, b) => a.props.createdAt - b.props.createdAt)
			break
		case 'votes':
			sorted.sort((a, b) => b.props.voteCount - a.props.voteCount)
			break
		case 'color':
			sorted.sort((a, b) => a.props.color.localeCompare(b.props.color))
			break
		default:
			exhaustiveSwitchError(order)
	}

	return sorted
}

export function alignNotesToGrid(
	editor: Editor,
	noteIds: TLShapeId[],
	gridSize: number = 64
): void {
	const notes = noteIds
		.map((id) => editor.getShape<TLNoteShape>(id))
		.filter((n): n is TLNoteShape => n !== undefined && n.type === 'note')

	if (notes.length === 0) return

	const allBounds = notes.map((note) => editor.getShapePageBounds(note.id)!)
	const commonBounds = Box.Common(allBounds)

	const changes: TLShapePartial[] = []

	for (const note of notes) {
		const bounds = editor.getShapePageBounds(note.id)!
		const gridX = Math.round((bounds.x - commonBounds.x) / gridSize) * gridSize + commonBounds.x
		const gridY = Math.round((bounds.y - commonBounds.y) / gridSize) * gridSize + commonBounds.y

		const delta = new Vec(gridX - bounds.x, gridY - bounds.y)

		const parent = editor.getShapeParent(note)
		if (parent) {
			const parentTransform = editor.getShapeParentTransform(note)
			if (parentTransform) delta.rot(-parentTransform.rotation())
		}

		delta.add(note)

		changes.push({
			id: note.id,
			type: note.type,
			x: delta.x,
			y: delta.y,
		})
	}

	if (changes.length > 0) {
		editor.updateShapes(changes)
	}
}

export function createFramesForColorGroups(
	editor: Editor,
	groups: NoteGroup[],
	padding: number = 40
): void {
	if (groups.length === 0) return

	const allNotes = groups.flatMap((g) => g.notes)
	const allBounds = allNotes.map((note) => editor.getShapePageBounds(note.id)!)
	const commonBounds = Box.Common(allBounds)

	let currentX = commonBounds.minX
	const spacing = 80

	for (const group of groups) {
		const groupBounds = Box.Common(
			group.notes.map((note) => editor.getShapePageBounds(note.id)!)
		)

		const frameWidth = groupBounds.width + padding * 2
		const frameHeight = groupBounds.height + padding * 2

		const frameId = createShapeId()

		editor.markHistoryStoppingPoint('creating frame for color group')

		editor.createShape({
			id: frameId,
			type: 'frame',
			x: currentX,
			y: groupBounds.minY - padding,
			props: {
				w: frameWidth,
				h: frameHeight,
				name: `${group.color} notes`,
				color: group.color as any,
			},
		})

		const frameBounds = editor.getShapePageBounds(frameId)!
		const offsetX = currentX - groupBounds.minX + padding

		const changes: TLShapePartial[] = group.notes.map((note) => {
			const noteBounds = editor.getShapePageBounds(note.id)!
			const newX = noteBounds.x + offsetX
			const delta = new Vec(newX - noteBounds.x, 0)

			const parent = editor.getShapeParent(note)
			if (parent) {
				const parentTransform = editor.getShapeParentTransform(note)
				if (parentTransform) delta.rot(-parentTransform.rotation())
			}

			delta.add(note)

			return {
				id: note.id,
				type: note.type,
				x: delta.x,
				y: delta.y,
				parentId: frameId,
			}
		})

		editor.updateShapes(changes)

		currentX += frameWidth + spacing
	}
}

export function autoTagNotes(editor: Editor, noteIds: TLShapeId[]): void {
	const notes = noteIds
		.map((id) => editor.getShape<TLNoteShape>(id))
		.filter((n): n is TLNoteShape => n !== undefined && n.type === 'note')

	if (notes.length === 0) return

	const texts = notes.map((note) => renderPlaintextFromRichText(editor, note.props.richText))
	const keywords = extractKeywordsWithTFIDF(texts, 3)

	const changes: TLShapePartial[] = notes.map((note, i) => ({
		id: note.id,
		type: note.type,
		props: {
			tags: keywords[i],
		},
	}))

	if (changes.length > 0) {
		editor.updateShapes(changes)
	}
}

export function createCardStackFromNotes(
	editor: Editor,
	noteIds: TLShapeId[]
): TLShapeId | null {
	const notes = noteIds
		.map((id) => editor.getShape<TLNoteShape>(id))
		.filter((n): n is TLNoteShape => n !== undefined && n.type === 'note')

	if (notes.length === 0) return null

	const allBounds = Box.Common(notes.map((note) => editor.getShapePageBounds(note.id)!))

	const stackId = createShapeId()

	editor.markHistoryStoppingPoint('creating card stack')

	editor.createShape({
		id: stackId,
		type: 'card-stack',
		x: allBounds.minX,
		y: allBounds.minY,
		props: {
			w: Math.max(allBounds.width, 220),
			h: Math.max(allBounds.height, 220),
			isExpanded: false,
			fanAngle: 60,
			cardGap: 16,
			color: 'black',
			name: '',
		},
	})

	const changes: TLShapePartial[] = notes.map((note, i) => {
		const noteBounds = editor.getShapePageBounds(note.id)!
		const localX = noteBounds.x - allBounds.minX + i * 2
		const localY = noteBounds.y - allBounds.minY + i * 2

		return {
			id: note.id,
			type: note.type,
			x: localX,
			y: localY,
			parentId: stackId,
		}
	})

	editor.updateShapes(changes)

	return stackId
}

export function voteForNote(editor: Editor, noteId: TLShapeId): void {
	const note = editor.getShape<TLNoteShape>(noteId)
	if (!note || note.type !== 'note') return

	editor.updateShapes([
		{
			id: noteId,
			type: 'note',
			props: {
				voteCount: note.props.voteCount + 1,
			},
		},
	])
}

export function sortNotesWithAnimation(
	editor: Editor,
	noteIds: TLShapeId[],
	order: NoteSortOrder
): void {
	const notes = noteIds
		.map((id) => editor.getShape<TLNoteShape>(id))
		.filter((n): n is TLNoteShape => n !== undefined && n.type === 'note')

	if (notes.length === 0) return

	const sorted = sortNotes(notes, order)
	const allBounds = Box.Common(notes.map((note) => editor.getShapePageBounds(note.id)!))

	const spacing = 20
	const noteWidth = 200
	const noteHeight = 200

	const changes: TLShapePartial[] = sorted.map((note, i) => {
		const currentBounds = editor.getShapePageBounds(note.id)!
		const newX = allBounds.minX + i * (noteWidth + spacing)
		const newY = allBounds.minY

		const delta = new Vec(newX - currentBounds.x, newY - currentBounds.y)

		const parent = editor.getShapeParent(note)
		if (parent) {
			const parentTransform = editor.getShapeParentTransform(note)
			if (parentTransform) delta.rot(-parentTransform.rotation())
		}

		delta.add(note)

		return {
			id: note.id,
			type: note.type,
			x: delta.x,
			y: delta.y,
		}
	})

	if (changes.length > 0) {
		editor.updateShapes(changes)
	}
}

export function exportNotesToMarkdown(
	editor: Editor,
	noteIds: TLShapeId[],
	includeStacks: boolean = true
): string {
	const lines: string[] = []

	const processShape = (shapeId: TLShapeId, depth: number = 0): void => {
		const shape = editor.getShape(shapeId)
		if (!shape) return

		const indent = '  '.repeat(depth)

		if (shape.type === 'card-stack') {
			const stackShape = shape as any
			const stackName = stackShape.props.name || 'Card Stack'
			lines.push(`${indent}- **${stackName}**`)

			if (includeStacks) {
				const childIds = editor.getSortedChildIdsForParent(shapeId)
				for (const childId of childIds) {
					processShape(childId, depth + 1)
				}
			}
		} else if (shape.type === 'note') {
			const noteShape = shape as TLNoteShape
			const text = renderPlaintextFromRichText(editor, noteShape.props.richText)

			let line = `${indent}- ${text || '(empty note)'}`

			const tags: string[] = []
			if (noteShape.props.voteCount > 0) {
				tags.push(`⭐${noteShape.props.voteCount}`)
			}
			if (noteShape.props.tags.length > 0) {
				tags.push(...noteShape.props.tags.map((t) => `#${t}`))
			}
			tags.push(`[${noteShape.props.color}]`)

			if (tags.length > 0) {
				line += ` ${tags.join(' ')}`
			}

			lines.push(line)
		} else if (shape.type === 'frame') {
			const frameShape = shape as any
			const frameName = frameShape.props.name || 'Frame'
			lines.push(`${indent}- **${frameName}**`)

			const childIds = editor.getSortedChildIdsForParent(shapeId)
			for (const childId of childIds) {
				processShape(childId, depth + 1)
			}
		}
	}

	for (const noteId of noteIds) {
		processShape(noteId, 0)
	}

	return lines.join('\n')
}

function exhaustiveSwitchError(value: never): never {
	throw new Error(`Unhandled case: ${value}`)
}
