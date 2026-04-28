import { ArrowBindingUtil } from './bindings/arrow/ArrowBindingUtil'
import { MindMapEdgeBindingUtil } from './bindings/mindmap-edge/MindMapEdgeBindingUtil'

/** @public */
export const defaultBindingUtils = [ArrowBindingUtil, MindMapEdgeBindingUtil] as const
