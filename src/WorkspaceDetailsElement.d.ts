import { CSSResult, LitElement, TemplateResult } from 'lit-element';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { DomainWorkspace } from '@advanced-rest-client/arc-types/src/domain/Workspace';
import {
  editHandler,
  descriptionTemplate,
} from './internals.js';

export const noDataTemplate: unique symbol;
export const valueTemplate: unique symbol;

/**
 * @fires edit
 */
export class WorkspaceDetailsElement extends ArcResizableMixin(LitElement) {
  static get styles(): CSSResult[];

  /**
   * The workspace object being rendered
   */
  workspace: DomainWorkspace;
  /**
   * Enables compatibility with Anypoint platform
   * @attribute
   */
  compatibility: boolean;

  constructor();

  /**
   * Sends non-bubbling `edit` event to the parent element to perform
   * edit action.
   */
  [editHandler](): void;

  render(): TemplateResult;

  /**
   * The template for the workspace description 
   */
  [descriptionTemplate](): TemplateResult|string;

  [noDataTemplate](): TemplateResult;

  [valueTemplate](value: string): TemplateResult;
}
