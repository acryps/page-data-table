import { Component, ComponentContent } from '@acryps/page';
import { DataTableGroup } from './group';

export class DataTable<ColumnType, RowType> extends Component {
	private columns: ColumnType[];
	private rootGroup: DataTableGroup<RowType>;
	
	constructor(
		columns?: ColumnType[],
		rowsOrGroups?: RowType[] | DataTableGroup<RowType>[]
	) {
		super();

		if (columns) {
			this.load(columns, rowsOrGroups);
		}
	}

	load(columns: ColumnType[], rowsOrGroups: RowType[] | DataTableGroup<RowType>[] | null) {
		this.columns = columns;

		if (Array.isArray(rowsOrGroups)) {
			this.rootGroup = new DataTableGroup<RowType>(null, rowsOrGroups as RowType[]);
		} else {
			this.rootGroup = new DataTableGroup<RowType>(null, []);
		}

		this.update();
	}

	loadRows(rows: RowType[]) {
		this.rootGroup.content = rows;

		this.update();
	}

	loadGroup(group: DataTableGroup<RowType>) {
		this.rootGroup = group;

		this.update();
	}

	loadGroups(groups: DataTableGroup<RowType>[]) {
		this.rootGroup.content = groups;

		this.update();
	}

	render() {
		const columnHeaders = this.columns.map(column => this.renderColumnHeader(column));
		let pivots: Element[];
		let content: Element;

		if (this.rootGroup.empty) {
			pivots = [];
			content = this.wrapInElement(this.renderEmptyTableMessage(), 'ui-empty');
		} else {
			// create pivot cells from first rows header count
			const firstRow = this.rootGroup.firstRow!;
			const firstRowHeaders = this.renderRowHeaders(firstRow);
			pivots = [];

			for (let headerIndex = 0; headerIndex < firstRowHeaders.length; headerIndex++) {
				pivots.push(this.wrapInElement(this.renderPivot(headerIndex), 'ui-pivot'));
			}

			content = this.renderGroup(this.rootGroup, firstRowHeaders);
		}

		return <ui-data-table>
			<ui-column-headers>
				{pivots}
				{columnHeaders}
			</ui-column-headers>

			<ui-content>
				{content}
			</ui-content>
		</ui-data-table>;
	}

	private renderGroup(group: DataTableGroup<RowType>, firstHeaders: ComponentContent[] | null): Element {
		let header;
		const content = [];

		if (group.header !== undefined) {
			header = this.renderGroupHeader(group);
		}

		for (let item of group.content) {
			if (item instanceof DataTableGroup) {
				content.push(this.renderGroup(item, firstHeaders));
			} else {
				// reuse the first headers used to get the pivot cell count
				let rowHeaders;

				if (firstHeaders) {
					rowHeaders = firstHeaders;
					firstHeaders = null;
				} else {
					rowHeaders = this.renderRowHeaders(item);
				}

				content.push(<ui-row>
					<ui-row-headers>
						{rowHeaders.map(header => this.wrapInElement(header, 'ui-header'))}
					</ui-row-headers>
					
					{this.columns.map(column => this.wrapInElement(this.renderCell(column, item as RowType), 'ui-cell'))}
				</ui-row>)
			}
		}

		return <ui-group>
			{this.wrapInElement(header, 'ui-header')}

			{content}
		</ui-group>;
	}

	/**
	 * Renders the pivot (empty column between the column and row headers)
	 * 
	 * @param index Index of the pivot cell
	 */
	renderPivot(index: number): ComponentContent {
		return <ui-pivot></ui-pivot>;
	}

	/**
	 * Handles empty tables
	 * 
	 * @returns Content
	 */
	renderEmptyTableMessage(): ComponentContent {
		return 'No data';
	}

	/**
	 * Renders the header of a column
	 * 
	 * @param column Current column
	 * @returns The rendered header column
	 */
	renderColumnHeader(column: ColumnType): ComponentContent {
		return `${column}`;
	}

	/**
	 * Renders the headers of a row
	 * *All rows must return the same number to headers*
	 * 
	 * @param row Current row
	 * @returns An array of rows, which will be wrapped in `<ui-header>` automatically, unless a <ui-header> is returned
	 */
	renderRowHeaders(row: RowType): ComponentContent[] {
		return [];
	}

	/**
	 * Renders a groups header
	 * This function will not be called for groups where the header is `undefined` (default group if none present)
	 * 
	 * @param group Current group
	 * @returns Rendered header
	 */
	renderGroupHeader(group: DataTableGroup<RowType>): ComponentContent {
		return group.header;
	}

	/**
	 * Renders one cell
	 * Any form field (`<select>` or `<input>`) will automatically be used when cycling inputs. Overwrite `findFields` for custom behavior
	 * 
	 * @param column Current column
	 * @param row Current row
	 * @returns The rendered column
	 */
	renderCell(column: ColumnType, row: RowType): ComponentContent {
		return;
	}

	/**
	 * Returns all form fields in a rendered cell
	 * The fields will be used in input focusing
	 * 
	 * @param rendered The rendered cell
	 * @returns Found fields
	 */
	findFields(rendered: ComponentContent) {
		const fields: Element[] = [];

		if (rendered instanceof Element) {
			if (rendered.tagName == 'INPUT' || rendered.tagName == 'SELECT') {
				fields.push(rendered);
			}
		} else if (Array.isArray(rendered)) {
			for (let item of rendered) {
				fields.push(...this.findFields(item));
			}
		}

		return fields;
	}

	private wrapInElement(content: ComponentContent, tagName: string) {
		if (content instanceof Element && content.tagName.toLowerCase() == tagName.toLowerCase()) {
			return content;
		}

		return this.createElement(tagName, null, content);
	}
}