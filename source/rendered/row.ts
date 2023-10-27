import { RenderedCell } from "./cell";
import { RenderedField } from "./field";

export class RenderedRow {
	constructor(
		public source: HTMLElement,
		public cells: RenderedCell[]
	) {}
}