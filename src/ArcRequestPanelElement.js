/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { ExportEvents, TelemetryEvents, TransportEventTypes } from '@advanced-rest-client/arc-events';
import { ArcModelEvents, ArcModelEventTypes } from '@advanced-rest-client/arc-models';
import '@advanced-rest-client/arc-response/response-view.js';
import '@advanced-rest-client/arc-ie/export-options.js';
import '@advanced-rest-client/bottom-sheet/bottom-sheet.js';
import elementStyles from './styles/Panel.js';
import '../arc-request-editor.js';
import '../request-meta-details.js';
import '../request-meta-editor.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcNativeDataExport} ArcNativeDataExport */
/** @typedef {import('@advanced-rest-client/arc-events').ApiRequestEvent} ApiRequestEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ApiResponseEvent} ApiResponseEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/arc-response/').ResponseViewElement} ResponseViewElement */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ProviderOptions} ProviderOptions */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ExportOptions} ExportOptions */
/** @typedef {import('./ArcRequestEditorElement').ArcRequestEditorElement} ArcRequestEditorElement */
/** @typedef {import('./RequestMetaEditorElement').RequestMetaEditorElement} RequestMetaEditorElement */

export const requestEditorTemplate = Symbol('requestEditorTemplate');
export const responseTemplate = Symbol('requestEditorTemplate');
export const loaderTemplate = Symbol('loaderTemplate');
export const requestTransportHandler = Symbol('requestTransportHandler');
export const responseTransportHandler = Symbol('responseTransportHandler');
export const responseClearHandler = Symbol('responseClearHandler');
export const requestChangeHandler = Symbol('requestChangeHandler');
export const requestClearHandler = Symbol('requestClearHandler');
export const selectedResponsePanelHandler = Symbol('selectedResponsePanelHandler');
export const activeResponsePanelsHandler = Symbol('activeResponsePanelsHandler');
export const keydownHandler = Symbol('keydownHandler');
export const notifyChange = Symbol('notifyChange');
export const exportTemplate = Symbol('exportTemplate');
export const sheetClosedHandler = Symbol('sheetClosedHandler');
export const acceptExportOptions = Symbol('acceptExportOptions');
export const cancelExportOptions = Symbol('cancelExportOptions');
export const exportRequestHandler = Symbol('exportRequestHandler');
export const requestDetailTemplate = Symbol('requestDetailTemplate');
export const detailRequestHandler = Symbol('detailRequestHandler');
export const requestMetaTemplate = Symbol('requestMetaTemplate');
export const metaRequestHandler = Symbol('metaRequestHandler');
export const requestDeletedHandler = Symbol('requestDeletedHandler');
export const requestMetaCloseHandler = Symbol('requestMetaCloseHandler');
export const metaUpdateHandler = Symbol('metaUpdateHandler');
export const storeRequestHandler = Symbol('storeRequestHandler');
export const storeAsRequestHandler = Symbol('storeAsRequestHandler');
export const boundEventsValue = Symbol('boundEventsValue');
export const retargetEvent = Symbol('retargetEvent');

/** 
 * @type {string[]}
 */
const defaultResponsePanels = ['response'];
const defaultSelectedResponsePanel = 'response';

export class ArcRequestPanelElement extends EventsTargetMixin(ArcResizableMixin(LitElement)) {
  static get styles() {
    return elementStyles;
  }

  static get properties() {
    return { 
      /** 
       * The ARC request object
       */
      editorRequest: { type: Object },
      /**
       * Computed value. If true then the request is loading.
       * This resets each time the request status changes.
       */
      loading: { type: Boolean },
      /**
       * Redirect URL for the OAuth2 authorization.
       * If can be also set by dispatching `oauth2-redirect-url-changed`
       * with `value` property on the `detail` object.
       */
      oauth2RedirectUri: { type: String },
      /**
       * When set it will ignore all `content-*` headers when the request method
       * is either `GET` or `HEAD`.
       * When not set or `false` it renders warning dialog.
       */
      ignoreContentOnGet: { type: Boolean },
      /**
       * Enables compatibility with Anypoint platform
       */
      compatibility: { type: Boolean },
      /**
       * Enables material's outlined theme for inputs.
       */
      outlined: { type: Boolean },

      /**
       * Indicates that the export options panel is currently rendered.
       */
      exportOptionsOpened: { type: Boolean },

      /**
       * Indicates that the request details is opened
       */
      requestDetailsOpened: { type: Boolean },

      /**
       * Indicates that the request meta editor is opened
       */
      requestMetaOpened: { type: Boolean },

      /**
       * When set it sets `eventsTarget` to itself and all editor event
       * listeners starts listening on this node.
       * This prohibits editors from getting data from the outside ot this
       * component.
       */
      boundEvents: { type: Boolean },
      /** 
       * When set it renders the send request button on the request editor
       */
      renderSend: { type: Boolean },
    };
  }

  get boundEvents() {
    return this[boundEventsValue];
  }

  set boundEvents(value) {
    const old = this[boundEventsValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this[boundEventsValue] = value;
    if (value) {
      this.eventsTarget = this;
    } else {
      this.eventsTarget = window;
    }
  }

  /**
   * @return {ArcRequestEditorElement} Reference to ArcRequestEditorElement element.
   */
  get editor() {
    return this.shadowRoot.querySelector('arc-request-editor');
  }

  constructor() {
    super();
    /**
     * @type {ArcEditorRequest}
     */
    this.editorRequest = {
      id: undefined,
      request: {
        url: '',
        method: 'GET',
      },
    };
    this.loading = false;
    this.ignoreContentOnGet = false;
    this.compatibility = false;
    this.outlined = false;
    this.requestDetailsOpened = false;
    this.requestMetaOpened = false;
    /**
     * @type {string}
     */
    this.oauth2RedirectUri = undefined;
    this.renderSend = false;
    
    this[requestTransportHandler] = this[requestTransportHandler].bind(this);
    this[responseTransportHandler] = this[responseTransportHandler].bind(this);
    this[keydownHandler] = this[keydownHandler].bind(this);
    this[requestDeletedHandler] = this[requestDeletedHandler].bind(this);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    super._attachListeners(node);
    window.addEventListener(TransportEventTypes.request, this[requestTransportHandler]);
    window.addEventListener(TransportEventTypes.response, this[responseTransportHandler]);
    window.addEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeletedHandler]);
    this.addEventListener('keydown', this[keydownHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    super._detachListeners(node);
    window.removeEventListener(TransportEventTypes.request, this[requestTransportHandler]);
    window.removeEventListener(TransportEventTypes.response, this[responseTransportHandler]);
    window.removeEventListener(ArcModelEventTypes.Request.State.delete, this[requestDeletedHandler]);
    this.removeEventListener('keydown', this[keydownHandler]);
  }

  /**
   * Runs current request.
   * Note, it does not validate the state of the request.
   */
  send() {
    this.editor.send();
  }

  /**
   * Calls abort on the request editor.
   */
  abort() {
    this.editor.abort();
    this.loading = false;
  }

  /**
   * Calls `clearRequest()` method of the `request-editor`
   */
  clear() {
    this.editor.reset();
  }

  /**
   * @param {KeyboardEvent} e
   */
  [keydownHandler](e) {
    if (this.loading && e.code === 'Escape') {
      this.abort();
    } else if (!this.loading && e.ctrlKey && e.code === 'Enter') {
      // @ts-ignore
      const isBody = e.composedPath().some((element) => element.localName === 'body-editor');
      if (!isBody) {
        this.send();
      }
    }
  }

  [notifyChange]() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * @param {ARCRequestDeletedEvent} e
   */
  [requestDeletedHandler](e) {
    const { id } = e;
    const { editorRequest } = this;
    const typed = /** @type ARCSavedRequest */ (editorRequest.request);
    if (typed._id !== id) {
      return;
    }
    const copy = { ...typed };
    delete copy._id;
    delete copy._rev;
    this.editorRequest.request = copy;
    this.requestUpdate();
    this[notifyChange]();
  }

  /**
   * A handler for the request being executed. If the request id corresponds to this requests id then it sets the `loading` property to `true`
   * A request transport event may not be initialized from within the request editor (from actions or modules, for example) so this listens on
   * all events.
   * 
   * @param {ApiRequestEvent} e
   */
  [requestTransportHandler](e) {
    const { id } = e.detail;
    const { editorRequest } = this;
    if (!editorRequest || editorRequest.id !== id) {
      return;
    }
    this.loading = true;
  }

  /**
   * A handler for the api response event dispatched by the request engine.
   * @param {ApiResponseEvent} e
   */
  [responseTransportHandler](e) {
    const { id, response, request } = e.detail;
    const { editorRequest } = this;
    if (!editorRequest || editorRequest.id !== id) {
      return;
    }
    this.editorRequest.request.transportRequest = request;
    this.editorRequest.request.response = response;
    this.loading = false;
    this.requestUpdate();
    this[notifyChange]();
  }

  [responseClearHandler]() {
    this.editorRequest.request.transportRequest = undefined;
    this.editorRequest.request.response = undefined;
    this.requestUpdate();
    this[notifyChange]();
  }

  /**
   * A handler for the request property change in the request editor. It updates the `editorRequest` property.
   * @param {Event} e
   */
  [requestChangeHandler](e) {
    const editor = /** @type ArcRequestEditorElement */ (e.target);
    const { request } = this.editorRequest;
    const serialized = editor.serialize();
    const newRequest = { ...request, ...serialized.request };
    serialized.request = newRequest;
    this.editorRequest = serialized;
    this[notifyChange]();
  }

  /**
   * A handler for the clear event dispatched by the editor.
   * Unlike the change handler it completely overrides the request.
   * @param {Event} e
   */
  [requestClearHandler](e) {
    const editor = /** @type ArcRequestEditorElement */ (e.target);
    this.editorRequest = editor.serialize();
    this[notifyChange]();
  }

  /**
   * @param {Event} e
   */
  [selectedResponsePanelHandler](e) {
    const panel = /** @type ResponseViewElement */ (e.target);
    const { selected } = panel;
    const { request } = this.editorRequest;
    if (!request.ui) {
      request.ui = {};
    }
    if (!request.ui.response) {
      request.ui.response = {};
    }
    request.ui.response.selectedPanel = selected;
    this[notifyChange]();
  }

  /**
   * @param {Event} e
   */
  [activeResponsePanelsHandler](e) {
    const panel = /** @type ResponseViewElement */ (e.target);
    const { active } = panel;
    const { request } = this.editorRequest;
    if (!request.ui) {
      request.ui = {};
    }
    if (!request.ui.response) {
      request.ui.response = {};
    }
    request.ui.response.activePanels = active;
    this[notifyChange]();
  }

  [sheetClosedHandler](e) {
    const prop = e.target.dataset.openProperty;
    this[prop] = e.detail.value;
  }

  /**
   * Handler for `accept` event dispatched by export options element.
   * @param {CustomEvent} e
   * @return {Promise} Result of calling `[doExportItems]()`
   */
  async [acceptExportOptions](e) {
    this.exportOptionsOpened = false;
    const { detail } = e;
    const provider = /** @type ProviderOptions */ (detail.providerOptions);
    const options = /** @type ExportOptions */ (detail.exportOptions);
    
    options.kind = 'ARC#AllDataExport';
    const data = /** @type ArcNativeDataExport */ ({
      requests: [this.editorRequest.request],
    });
    this.errorMessage = undefined;
    try {
      const result = await ExportEvents.nativeData(this, data, options, provider);
      if (!result) {
        throw new Error('Certificates: Export module not found');
      }
      // if (detail.options.provider === 'drive') {
      //   // TODO: Render link to the folder
      //   this.shadowRoot.querySelector('#driveSaved').opened = true;
      // }
    } catch (err) {
      // this[handleException](e.message);
    }
    TelemetryEvents.event(this, {
      category: 'Request panel',
      action: 'export',
      label: options.provider,
    });
  }

  [cancelExportOptions]() {
    this.exportOptionsOpened = false;
    TelemetryEvents.event(this, {
      category: 'Request panel',
      action: 'cancel-export',
    });
  }

  [exportRequestHandler]() {
    this.exportOptionsOpened = true;
  }

  [detailRequestHandler]() {
    this.requestDetailsOpened = true;
  }

  [metaRequestHandler]() {
    this.requestMetaOpened = true;
    this.requestDetailsOpened = false;
  }

  [requestMetaCloseHandler]() {
    this.requestMetaOpened = false;
  }

  /**
   * A handler for the "save" event dispatched by the editor.
   * Depending whether the current request is already stored or not it either
   * dispatches the event to store the request or opens meta editor.
   */
  [storeRequestHandler]() {
    this.saveAction();
  }

  /**
   * Initializes the save request flow.
   * If the request is already stored in the data store then it is automatically saved.
   * Otherwise a save dialog is rendered,
   */
  saveAction() {
    const { editorRequest } = this;
    const typed = /** @type ARCSavedRequest */ (editorRequest.request);
    if (!typed._id || !typed._rev || !typed.type) {
      this.requestMetaOpened = true;
    } else {
      ArcModelEvents.Request.store(this, typed.type, typed);
    }
  }

  [storeAsRequestHandler]() {
    this.saveAsAction();
  }

  /**
   * Triggers the UI to save the current request as a new request, regardless of the current state.
   */
  saveAsAction() {
    this.requestMetaOpened = true;
    const editor = this.shadowRoot.querySelector('request-meta-editor');
    editor.saveAs = true;
  }

  /**
   * Handler for the event dispatched by the meta editor indicating that the request has changed.
   * @param {CustomEvent} e
   */
  [metaUpdateHandler](e) {
    const editor = /** @type RequestMetaEditorElement */ (e.target);
    const updated = e.detail;
    if (editor.saveAs) {
      editor.saveAs = false;
    } else {
      this.editorRequest.request = updated;
    }
    this[notifyChange]();
    this.requestUpdate();
  }

  /**
   * Retargets the event to the parent.
   * @param {Event} e 
   */
  [retargetEvent](e) {
    this.dispatchEvent(new Event(e.type));
  }

  render() {
    return html`
    ${this[requestEditorTemplate]()}
    ${this[loaderTemplate]()}
    ${this[responseTemplate]()}
    ${this[exportTemplate]()}
    ${this[requestDetailTemplate]()}
    ${this[requestMetaTemplate]()}
    `;
  }

  /**
   * @returns {TemplateResult} The template for the request editor view
   */
  [requestEditorTemplate]() {
    const { compatibility, oauth2RedirectUri, loading } = this;
    const editorRequest = /** @type ArcEditorRequest */ (this.editorRequest || {});
    const { id } = editorRequest;
    const request = /** @type ARCSavedRequest */ (editorRequest.request || {});
    const { method, ui, url, actions, payload, authorization, config, headers, _id, type } = request;
    return html`
    <arc-request-editor
      ?compatibility="${compatibility}"
      .eventsTarget="${this.eventsTarget}"
      .requestId="${id}"
      .url="${url}"
      .method="${method}"
      .headers="${headers}"
      .responseActions="${actions && actions.response}"
      .requestActions="${actions && actions.request}"
      .payload="${payload}"
      .authorization="${authorization}"
      .uiConfig="${ui}"
      .config="${config}"
      .oauth2RedirectUri="${oauth2RedirectUri}"
      .storedId="${_id}"
      .storedType="${type}"
      .loading="${loading}"
      ?renderSend="${this.renderSend}"
      class="panel"
      @change="${this[requestChangeHandler]}"
      @clear="${this[requestClearHandler]}"
      @export="${this[exportRequestHandler]}"
      @details="${this[detailRequestHandler]}"
      @save="${this[storeRequestHandler]}"
      @saveas="${this[storeAsRequestHandler]}"
      @close="${this[retargetEvent]}"
      @duplicate="${this[retargetEvent]}"
    ></arc-request-editor>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the response view
   */
  [responseTemplate]() {
    const { editorRequest } = this;
    const { transportRequest, response, ui={} } = editorRequest.request;
    const classes = {
      panel: true,
      'scrolling-region': this.classList.contains('stacked'),
    };
    return html`
    <response-view
      .response="${response}"
      .request="${transportRequest}"
      .selected="${ui.response && ui.response.selectedPanel || defaultSelectedResponsePanel}"
      .active="${ui.response && ui.response.activePanels || defaultResponsePanels}"
      class="${classMap(classes)}"
      @clear="${this[responseClearHandler]}"
      @selectedchange="${this[selectedResponsePanelHandler]}"
      @activechange="${this[activeResponsePanelsHandler]}"
    ></response-view>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the request loader
   */
  [loaderTemplate]() {
    if (!this.loading) {
      return '';
    }
    return html`
    <progress class="loading-progress"></progress>
    `;
  }

  [exportTemplate]() {
    const { compatibility, outlined, exportOptionsOpened } = this;
    return html`
    <bottom-sheet
      class="bottom-sheet-container"
      .opened="${exportOptionsOpened}"
      data-open-property="exportOptionsOpened"
      @closed="${this[sheetClosedHandler]}"
    >
      <export-options
        id="exportOptions"
        ?compatibility="${compatibility}"
        ?outlined="${outlined}"
        withEncrypt
        file="arc-request.json"
        provider="file"
        @accept="${this[acceptExportOptions]}"
        @cancel="${this[cancelExportOptions]}"
      ></export-options>
    </bottom-sheet>`;
  }

  [requestDetailTemplate]() {
    const { compatibility, requestDetailsOpened, editorRequest } = this;
    const typed = /** @type ARCSavedRequest */ (editorRequest.request);
    let type;
    if (requestDetailsOpened && typed._id) {
      type = typed.type;
    }
    return html`
    <bottom-sheet
      class="bottom-sheet-container"
      .opened="${requestDetailsOpened}"
      data-open-property="requestDetailsOpened"
      @closed="${this[sheetClosedHandler]}"
    >
      <request-meta-details
        ?compatibility="${compatibility}"
        .request="${typed}"
        .requestId="${typed._id}"
        .requestType="${type}"
        @edit="${this[metaRequestHandler]}"
      ></request-meta-details>
    </bottom-sheet>`;
  }

  [requestMetaTemplate]() {
    const { compatibility, requestMetaOpened, editorRequest } = this;
    const typed = /** @type ARCSavedRequest */ (editorRequest.request);
    let type;
    if (requestMetaOpened && typed._id) {
      type = typed.type;
    }
    return html`
    <bottom-sheet
      class="bottom-sheet-container"
      .opened="${requestMetaOpened}"
      data-open-property="requestMetaOpened"
      @closed="${this[sheetClosedHandler]}"
    >
      <request-meta-editor
        ?compatibility="${compatibility}"
        .request="${typed}"
        .requestId="${typed._id}"
        .requestType="${type}"
        @close="${this[requestMetaCloseHandler]}"
        @update="${this[metaUpdateHandler]}"
      ></request-meta-editor>
    </bottom-sheet>`;
  }
}
