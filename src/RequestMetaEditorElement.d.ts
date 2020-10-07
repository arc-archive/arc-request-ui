/* eslint-disable no-plusplus */

import { TemplateResult, CSSResult } from 'lit-element';
import {
  ProjectsListConsumerMixin,
  internals,
} from '@advanced-rest-client/requests-list';
import { RequestMetaDetailsElement } from './RequestMetaDetailsElement.js';
import {
  requestChanged,
  titleTemplate,
  nameInputTemplate,
  selectedProjectsValue,
  overrideValue,
  savingValue,
  submitHandler,
  overrideHandler,
  computeEventDetail,
  restoreProjects,
  inputHandler,
  projectsHandler,
  cancelHandler,
  saveHandler,
  editorValueHandler,
  descriptionTemplate,
  actionsTemplate,
  savedActionsTemplate,
  unsavedActionsTemplate,
  projectsTemplate,
} from './internals.js';
import { ARCProjectUpdatedEvent } from '@advanced-rest-client/arc-models';
import { ArcRequest } from '@advanced-rest-client/arc-types';

/** @typedef {import('@advanced-rest-client/requests-list/src/ProjectsListConsumerMixin').ProjectSelectionInfo} ProjectSelectionInfo */
/** @typedef {import('@advanced-rest-client/arc-models').ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('lit-element').CSSResult} CSSResult */

/**
 * A dialog to edit request meta data.
 *
 * It requires `<request-model>` and `<project-model>` to be in the DOM to
 * handle data queries.
 *
 * ## Usage
 *
 * Assign `request` property to a request object. The component decides
 * what view to render (saved vs. not saved request).
 *
 * ```html
 * <saved-request-editor request='{...}'></saved-request-editor>
 * ```
 *
 * If the request has both `_id` and `_rev` properties (PouchDB properties)
 * it renders "saved" view.
 */
export declare class RequestMetaEditorElement {
  
  static readonly styles: CSSResult[];

  /**
   * Name of the request.
   */
  name: string;
  /**
   * Request description.
   */
  description: string;
  /**
   * List of selected in the dialog project names.
   */
  selectedProjects: string[];
  [selectedProjectsValue]: string[];
  /**
   * Enables material's outlined theme for inputs.
   */
  outlined: boolean;

  /**
   * Computes value for `isSaved` property.
   */
  readonly isSavedRequest: boolean;

  [overrideValue]: boolean;
  [savingValue]: boolean;

  constructor();

  [internals.projectChangeHandler](e: ARCProjectUpdatedEvent): Promise<void>;

  /**
   * Resets the state of the UI
   */
  reset(): void;

  /**
   * Sends the `cancel` custom event to cancel the edit.
   */
  [cancelHandler](): void;

  /**
   * Sets `override` to `false` and sends the form.
   */
  [saveHandler](): void;

  /**
   * Sets `override` to `true` and sends the form.
   */
  [overrideHandler](): void;

  /**
   * Validates and submits the form.
   */
  send(): void;

  /**
   * Sends the `save-request` custom event with computed detail object.
   */
  [submitHandler](e: CustomEvent): Promise<void>

  /**
   * Computes `save-request` custom event's `detail` object
   * @returns A detail property of the event.
   */
  [computeEventDetail](): object;

  [requestChanged](): void;

  /**
   * Reads project data from the request object
   */
  [restoreProjects](request: ArcRequest.ARCSavedRequest|ArcRequest.ARCHistoryRequest): void;

  [inputHandler](e: CustomEvent): void;

  [projectsHandler](e: CustomEvent): void;

  [editorValueHandler](e: CustomEvent): void;

  notifyResize(): void;

  [titleTemplate](): TemplateResult;

  [nameInputTemplate](): TemplateResult;

  [descriptionTemplate](): TemplateResult;

  [projectsTemplate](): TemplateResult;

  [actionsTemplate](): TemplateResult;

  [savedActionsTemplate](): TemplateResult;

  [unsavedActionsTemplate](): TemplateResult;

  render(): TemplateResult;
}

export declare interface RequestMetaEditorElement extends ProjectsListConsumerMixin, RequestMetaDetailsElement {
}