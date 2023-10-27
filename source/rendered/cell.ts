import { RenderedField } from "./field";

export class RenderedCell {
	constructor(
		public source: HTMLElement,
		public fields: RenderedField[]
	) {}
}