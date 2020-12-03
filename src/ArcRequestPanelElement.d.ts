import { LitElement, CSSResult, TemplateResult } from 'lit-element';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { ARCRequestDeletedEvent } from '@advanced-rest-client/arc-models';
import { ArcEditorRequest } from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import { ApiRequestEvent, ApiResponseEvent } from '@advanced-rest-client/arc-events';
import { ArcRequestEditorElement } from './ArcRequestEditorElement';

export declare const requestEditorTemplate: unique symbol;
export declare const responseTemplate: unique symbol;
export declare const loaderTemplate: unique symbol;
export declare const requestTransportHandler: unique symbol;
export declare const responseTransportHandler: unique symbol;
export declare const responseClearHandler: unique symbol;
export declare const requestChangeHandler: unique symbol;
export declare const requestClearHandler: unique symbol;
export declare const selectedResponsePanelHandler: unique symbol;
export declare const activeResponsePanelsHandler: unique symbol;
export declare const keydownHandler: unique symbol;
export declare const notifyChange: unique symbol;
export declare const exportTemplate: unique symbol;
export declare const sheetClosedHandler: unique symbol;
export declare const acceptExportOptions: unique symbol;
export declare const cancelExportOptions: unique symbol;
export declare const exportRequestHandler: unique symbol;
export declare const requestDetailTemplate: unique symbol;
export declare const detailRequestHandler: unique symbol;
export declare const requestMetaTemplate: unique symbol;
export declare const metaRequestHandler: unique symbol;
export declare const requestDeletedHandler: unique symbol;
export declare const requestMetaCloseHandler: unique symbol;
export declare const metaUpdateHandler: unique symbol;
export declare const storeRequestHandler: unique symbol;
export declare const storeAsRequestHandler: unique symbol;
export declare const boundEventsValue: unique symbol;
export declare const retargetEvent: unique symbol;

/**
 * @fires selectedresponsepanelchange When selected tab in the response panel change
 * @fires responsepanelschange When the number of opened response panels change
 * @fires change When the editor request object change
 * @fires close Retargeted from the editor event
 * @fires duplicate Retargeted from the editor event
 */
export declare class ArcRequestPanelElement extends EventsTargetMixin(ArcResizableMixin(LitElement)) {
  static get styles(): CSSResult;

  /** 
   * The ARC request object
   */
  editorRequest: ArcEditorRequest;
  /**
   * Computed value. If true then the request is loading.
   * This resets each time the request status changes.
   * @attribute
   */
  loading: boolean;
  /**
   * Redirect URL for the OAuth2 authorization.
   * If can be also set by dispatching `oauth2-redirect-url-changed`
   * with `value` property on the `detail` object.
   * @attribute
   */
  oauth2RedirectUri: string;
  /**
   * When set it will ignore all `content-*` headers when the request method
   * is either `GET` or `HEAD`.
   * When not set or `false` it renders warning dialog.
   * @attribute
   */
  ignoreContentOnGet: boolean;
  /**
   * Enables compatibility with Anypoint platform
   * @attribute
   */
  compatibility: boolean;
  /**
   * Enables material's outlined theme for inputs.
   * @attribute
   */
  outlined: boolean;
  /** 
   * The list of active response panel (renderer panels). This is a list of names of opened panels.
   * @attribute
   */
  responsePanels: string[];
  /** 
   * The name of the selected response panel.
   * @attribute
   */
  selectedResponsePanel: string;

  /**
   * Indicates that the export options panel is currently rendered.
   * @attribute
   */
  exportOptionsOpened: boolean;

  /**
   * Indicates that the request details is opened
   * @attribute
   */
  requestDetailsOpened: boolean;

  /**
   * Indicates that the request meta editor is opened
   * @attribute
   */
  requestMetaOpened: boolean;

  /**
   * When set it sets `eventsTarget` to itself and all editor event
   * listeners starts listening on this node.
   * This prohibits editors from getting data from the outside ot this
   * component.
   * @attribute
   */
  boundEvents: boolean;

  /**
   * Reference to ArcRequestEditorElement element.
   */
  get editor(): ArcRequestEditorElement;

  constructor();

  _attachListeners(node: EventTarget): void;

  _detachListeners(node: EventTarget): void;

  /**
   * Runs current request.
   * Note, it does not validate the state of the request.
   */
  send(): void;

  /**
   * Calls abort on the request editor.
   */
  abort(): void;

  /**
   * Calls `clearRequest()` method of the `request-editor`
   */
  clear(): void;

  [keydownHandler](e: KeyboardEvent): void;

  [notifyChange](): void;

  [requestDeletedHandler](e: ARCRequestDeletedEvent): void;

  /**
   * A handler for the request being executed. If the request id corresponds to this requests id then it sets the `loading` property to `true`
   * A request transport event may not be initialized from within the request editor (from actions or modules, for example) so this listens on
   * all events.
   */
  [requestTransportHandler](e: ApiRequestEvent): void;

  /**
   * A handler for the api response event dispatched by the request engine.
   */
  [responseTransportHandler](e: ApiResponseEvent): void;

  [responseClearHandler](): void;

  /**
   * A handler for the request property change in the request editor. It updates the `editorRequest` property.
   */
  [requestChangeHandler](e: Event): void;

  /**
   * A handler for the clear event dispatched by the editor.
   * Unlike the change handler it completely overrides the request.
   */
  [requestClearHandler](e: Event): void;

  [selectedResponsePanelHandler](e: Event): void;

  [activeResponsePanelsHandler](e: Event): void;

  [sheetClosedHandler](e: Event): void;

  /**
   * Handler for `accept` event dispatched by export options element.
   */
  [acceptExportOptions](e: CustomEvent): Promise<void>;

  [cancelExportOptions](): void;

  [exportRequestHandler](): void;

  [detailRequestHandler](): void;

  [metaRequestHandler](): void;

  [requestMetaCloseHandler](): void;

  /**
   * A handler for the "save" event dispatched by the editor.
   * Depending whether the current request is already stored or not it either
   * dispatches the event to store the request or opens meta editor.
   */
  [storeRequestHandler](): void;

  [storeAsRequestHandler](): void;

  /**
   * Handler for the event dispatched by the meta editor indicating that the request has changed.
   */
  [metaUpdateHandler](e: CustomEvent): void;

  /**
   * Retargets the event to the parent.
   */
  [retargetEvent](e: Event): void;

  render(): TemplateResult;

  /**
   * @returns The template for the request editor view
   */
  [requestEditorTemplate](): TemplateResult;

  /**
   * @returns The template for the response view
   */
  [responseTemplate](): TemplateResult;

  /**
   * @returns The template for the request loader
   */
  [loaderTemplate](): TemplateResult|string;

  [exportTemplate](): TemplateResult;

  [requestDetailTemplate](): TemplateResult;

  [requestMetaTemplate](): TemplateResult;
}
