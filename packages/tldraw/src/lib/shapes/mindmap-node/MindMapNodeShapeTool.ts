import { StateNode, TLStateNodeConstructor } from '@tldraw/editor'
import { Idle } from './toolStates/Idle'
import { Pointing } from './toolStates/Pointing'

export class MindMapNodeShapeTool extends StateNode {
	static override id = 'mindmap-node'
	static override initial = 'idle'
	static override children(): TLStateNodeConstructor[] {
		return [Idle, Pointing]
	}
	override shapeType = 'mindmap-node'
}
