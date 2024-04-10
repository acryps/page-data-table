import { RenderedField } from "./field";

export class RenderedCell {
	fields: RenderedField[] = [];

	constructor(
		public source: HTMLElement
	) {}
}