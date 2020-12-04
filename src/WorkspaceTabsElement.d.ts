import { LitElement, CSSResult, TemplateResult } from 'lit-element';
import { SelectableMixin } from '@anypoint-web-components/anypoint-selector';

export declare const itemsChangeHandler: unique symbol;
export declare const keyDownHandler: unique symbol;

export declare class WorkspaceTabsElement extends SelectableMixin(LitElement) {
  static get styles(): CSSResult;

  constructor();

  connectedCallback(): void;

  disconnectedCallback(): void;

  _applySelection(item: HTMLElement, isSelected: boolean): void;

  [itemsChangeHandler](): void;

  [keyDownHandler](e: KeyboardEvent): void;

  render(): TemplateResult;
}
