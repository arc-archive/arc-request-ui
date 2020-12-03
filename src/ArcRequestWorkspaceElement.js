/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { WorkspaceEvents } from '@advanced-rest-client/arc-events';
// import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
// import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import elementStyles from './styles/Workspace.js';
import '../arc-request-panel.js';
import '../workspace-tab.js'
import '../workspace-tabs.js'

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */
/** @typedef {import('@anypoint-web-components/anypoint-tabs').AnypointTabs} AnypointTabs */
/** @typedef {import('@anypoint-web-components/anypoint-tabs').AnypointTab} AnypointTab *
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('./types').WorkspaceTab} WorkspaceTab */
/** @typedef {import('./types').AddRequestOptions} AddRequestOptions */
/** @typedef {import('./types').WorkspaceRequest} WorkspaceRequest */
/** @typedef {import('./ArcRequestPanelElement').ArcRequestPanelElement} ArcRequestPanelElement */

export const addTab = Symbol('addTab');
export const createTab = Symbol('createTab');
export const updateTab = Symbol('updateTab');
export const tabsValue = Symbol('tabsValue');
export const requestsValue = Symbol('requestsValue');
export const tabsTemplate = Symbol('tabsTemplate');
export const tabTemplate = Symbol('tabTemplate');
export const panelsTemplate = Symbol('panelsTemplate');
export const panelTemplate = Symbol('panelTemplate');
export const closeRequestHandler = Symbol('closeRequestHandler');
export const tabsSelectionHandler = Symbol('tabsSelectionHandler');
export const requestChangeHandler = Symbol('requestChangeHandler');
export const tabDragStartHandler = Symbol('tabDragStartHandler');
export const tabDragEndHandler = Symbol('tabDragEndHandler');
export const reorderInfo = Symbol('reorderInfo');
export const workspaceValue = Symbol('workspaceValue');
export const restoreRequests = Symbol('restoreRequests');
export const readTabLabel = Symbol('readTabLabel');
export const storeWorkspace = Symbol('storeWorkspace');
export const storeTimeoutValue = Symbol('storeTimeoutValue');
export const syncWorkspaceRequests = Symbol('syncWorkspaceRequests');
export const addNewHandler = Symbol('addNewHandler');

export class ArcRequestWorkspaceElement extends ArcResizableMixin(EventsTargetMixin(LitElement)) {
  static get styles() {
    return elementStyles;
  }

  static get properties() {
    return { 
      /** 
       * The index of the selected panel. This is the index of the tab to be selected.
       */
      selected: { type: Number, reflect: true },
      /** 
       * Enables the compatibility with Anypoint styling.
      */
      compatibility: { type: Boolean },
      /**
       * Redirect URL for the OAuth2 authorization.
       * If can be also set by dispatching `oauth2-redirect-url-changed`
       * with `value` property on the `detail` object.
       */
      oauth2RedirectUri: { type: String },
      /** 
       *  When set, this identifier will be passed to the read and write workspace events
       */
      backendId: { type: String },

      /** 
       * When set it requests workspace state read when connected to the DOM.
       */
      autoRead: { type: Boolean },
      /** 
       * A timeout after which the actual store workspace event is dispatched.
       * Default to 500 (ms).
       */
      storeTimeout: { type: Number },
    };
  }

  constructor() {
    super();
    /**  
     * @type {WorkspaceTab[]}
     * Mote, tabs are in sync with workspace requests array
     */
    this[tabsValue] = [];
    /** 
     * @type {WorkspaceRequest[]}
     */
    this[requestsValue] = [];

    this.compatibility = false;
    /** 
     * @type {number}
     */
    this.selected = undefined;
    /** 
     * @type {string}
     */
    this.oauth2RedirectUri = undefined;
    /** 
     * @type {DomainWorkspace}
     */
    this[workspaceValue] = {
      kind: 'ARC#DomainWorkspace',
      id: v4(),
    };
    /** 
     * @type {string}
     */
    this.backendId = undefined;
    this.autoRead = false;
    this.storeTimeout = 500;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.autoRead) {
      this.restore();
    }
  }

  /**
   * Dispatches the workspace restore event and sets the workspace data.
   * If the event does not return workspace an empty workspace is created.
   */
  async restore() {
    this.clear();
    const result = await WorkspaceEvents.read(this, this.backendId);
    if (result) {
      if (!result.id) {
        result.id = v4();
      }
      this[workspaceValue] = result;
    } else {
      this[workspaceValue] = /** @type DomainWorkspace */ ({
        kind: 'ARC#DomainWorkspace',
        id: v4(),
      });
    }
    this.processWorkspace(this[workspaceValue]);
    await this.requestUpdate();
    this.notifyResize();
  }

  /**
   * Dispatches an event to store the current workspace.
   */
  async store() {
    if (this[storeTimeoutValue]) {
      clearTimeout(this[storeTimeoutValue]);
    }
    this[storeTimeoutValue] = setTimeout(() => this[storeWorkspace](), this.storeTimeout);
  }

  async [storeWorkspace]() {
    this[storeTimeoutValue] = undefined;
    this[syncWorkspaceRequests]();
    const workspace = this[workspaceValue];
    await WorkspaceEvents.write(this, workspace, this.backendId);
  }

  /**
   * A function that updates workspace requests array to reflect the current order and properties of the panels.
   */
  [syncWorkspaceRequests]() {
    const result = [];
    const tabs = this[tabsValue];
    const requests = this[requestsValue];
    tabs.forEach((tab) => {
      const request = requests.find((item) => item.tab === tab.id);
      if (request) {
        result.push(request.request)
      }
    });
    this[workspaceValue].requests = result;
  }

  /**
   * Updates local properties from the workspace state file.
   * @param {DomainWorkspace} workspace
   */
  processWorkspace(workspace) {
    this[restoreRequests](workspace.requests);
    if (typeof workspace.selected === 'number') {
      this.selected = workspace.selected;
    } else {
      this.selected = 0;
    }
  }

  /**
   * @param {(ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest)[]} requests
   */
  [restoreRequests](requests) {
    if (!Array.isArray(requests) || !requests.length) {
      this.addEmpty();
      return;
    }
    requests.forEach((request) => this.add(request, { noAutoSelect: true, skipPositionCheck: true, skipUpdate: true, skipStore: true,}));
  }

  /**
   * Adds new request to the workspace.
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request
   * @param {AddRequestOptions} [options={}] Append options
   * @returns {number} The index at which the request was inserted.
   */
  add(request, options={}) {
    let index = options.skipPositionCheck ? -1 : this.findEmptyPosition();
    let tab;
    if (index !== -1) {
      this[requestsValue][index].request = request;
      tab = this[requestsValue][index].tab;
      this[updateTab](tab, request);
    } else {
      tab = this[addTab](request);
      const info = /** @type WorkspaceRequest */ ({
        id: v4(),
        request,
        tab,
      });
      const length = this[requestsValue].push(info);
      index = length - 1;
    }
    
    if (!options.noAutoSelect) {
      this.selectByTabId(tab);
    }
    if (!options.skipUpdate) {
      this.requestUpdate();
    }
    if (!options.skipStore) {
      this.store();
    }
    return index;
  }

  /**
   * Adds an empty request to the workspace.
   * @returns {number} The index at which the request was inserted.
   */
  addEmpty() {
    return this.add({
      method: 'GET',
      url: 'http://'
    });
  }

  /**
   * Adds a request at specific position moving the request at the position to the right.
   * If the position is out of `activeRequests` bounds.
   * 
   * @param {number} index The position of the tab where to put the request
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request Request object to put.
   * @param {AddRequestOptions=} options Add request options
   * 
   * @returns {number} The position at which the tab was inserted. It might be different than requested when the index is out of bounds.
   */
  addAt(index, request, options={}) {
    const tabs = this[tabsValue];
    if (index >= tabs.length) {
      return this.add(request, options);
    }
    const tab = this[createTab](request);
    tabs.splice(index, 0, tab);
    const info = /** @type WorkspaceRequest */ ({
      id: v4(),
      request,
      tab: tab.id,
    });
    const length = this[requestsValue].push(info);
    this.requestUpdate();
    if (!options.noAutoSelect) {
      this.selectByTabId(tab.id);
    }
    if (!options.skipStore) {
      this.store();
    }
    return length - 1;
  }
  
  /**
   * Removes a request for given index in the tabs array.
   * @param {number} index THe tab index to remove.
   * @param {boolean=} ignoreSelection When set it does not updates the selection state.
   */
  removeRequest(index, ignoreSelection=false) {
    const tabs = this[tabsValue];
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    tabs.splice(index, 1);
    const requests = this[requestsValue];
    const requestIndex = requests.findIndex((item) => item.tab === tab.id);
    if (requestIndex !== -1) {
      requests.splice(requestIndex, 1);
    }
    this.requestUpdate();
    this.store();
    if (ignoreSelection) {
      return;
    }
    let i = index;
    if (i === this.selected) {
      i -= 1;
      if (i < 0) {
        i = 0;
      }
      if (i === 0) {
        this.selected = undefined;
      }
      this.selected = i;
    } else if (this.selected > i) {
      this.selected -= 1;
    }
    if (!tabs.length) {
      requestAnimationFrame(() => this.addEmpty());
    }
    this[workspaceValue].selected = this.selected;
    this.store();
  }

  /**
   * Finds first position where the request is empty.
   * @return {Number} Index of empty request or `-1`.
   */
  findEmptyPosition() {
    const requests = this[requestsValue];
    let result = -1;
    if (!Array.isArray(requests) || !requests.length) {
      return result;
    }
    result = requests.findIndex((item) => (!item.request.url || item.request.url === 'http://') && !item.request.headers && !item.request.payload);
    return result;
  }

  /**
   * Selects a tab by its id.
   * @param {string} id Tab id.
   */
  selectByTabId(id) {
    const tabIndex = this[tabsValue].findIndex((item) => item.id === id);
    if (this.selected !== tabIndex) {
      this.selected = tabIndex;
      this[workspaceValue].selected = this.selected;
      this.store();
    }
  }

  /**
   * Adds a new tab to the tabs list.
   * Note, this function does not call `requestUpdate()`.
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   * @returns {string} The id of the created tab
   */
  [addTab](request) {
    const tab = this[createTab](request);
    this[tabsValue].push(tab);
    return tab.id;
  }

  /**
   * Creates a definition of a tab.
   * 
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   * @returns {WorkspaceTab} The definition of a tab.
   */
  [createTab](request) {
    const typed = /** @type ARCSavedRequest */ (request);
    const label = this[readTabLabel](typed);
    return {
      id: v4(),
      label,
    };
  }

  /**
   * Updates the tab value from the request.
   * Note, this function does not call `requestUpdate()`.
   * 
   * @param {string} id The id of the tab to update
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   */
  [updateTab](id, request) {
    const tab = this[tabsValue].find((item) => item.id === id);
    if (!tab) {
      return;
    }
    const typed = /** @type ARCSavedRequest */ (request);
    tab.label = this[readTabLabel](typed);
  }

  /**
   * @param {ARCSavedRequest} request
   * @returns {string} The label for the tab for a given request.
   */
  [readTabLabel](request) {
    if (request.name) {
      return request.name;
    }
    if (request.url && request.url !== 'http://' && request.url.length > 6) {
      return request.url;
    }
    return 'New request';
  }

  /**
   * Clears the workspace
   */
  clear() {
    this[tabsValue] = [];
    this[requestsValue] = /** @type WorkspaceRequest[] */ ([]);
    this.selected = undefined;
    this[workspaceValue].selected = undefined;
    this.store();
  }

  /**
   * Handler for click event on the request close button.
   * @param {PointerEvent} e
   */
  [closeRequestHandler](e) {
    e.preventDefault();
    e.stopPropagation();
    const node = /** @type HTMLElement */ (e.currentTarget);
    const index = Number(node.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    this.removeRequest(index);
  }

  /**
   * The handler for the tabs selection change event
   * @param {Event} e
   */
  async [tabsSelectionHandler](e) {
    const node = /** @type AnypointTabs */ (e.target);
    this.selected = Number(node.selected);
    this[workspaceValue].selected = this.selected;
    this.store();
    await this.updateComplete;
    this.notifyResize();
  }

  [requestChangeHandler](e) {
    const panel = /** @type ArcRequestPanelElement */ (e.target);
    const request = panel.editorRequest;
    const tabId = panel.dataset.tab;
    const index = Number(panel.dataset.index);
    this[requestsValue][index].id = request.id;
    this[requestsValue][index].request = request.request;
    this[updateTab](tabId, request.request);
    this.requestUpdate();
    this.store();
  }

  /**
   * @param {DragEvent} e
   */
  [tabDragStartHandler](e) {
    const node = /** @type AnypointTab */ (e.currentTarget);
    const index = Number(node.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    const tabs = this[tabsValue];
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    const requests = this[requestsValue];
    const requestIndex = requests.findIndex((item) => item.tab === tab.id);
    if (requestIndex === -1) {
      return;
    }
    const request = requests[requestIndex];
    const typed = /** @type ARCSavedRequest */ (request.request);
    const dt = e.dataTransfer;
    if (typed._id) {
      dt.setData('arc/id', typed._id);
      dt.setData('arc/type', typed.type);
      if (typed.type === 'history') {
        dt.setData('arc/history', '1');
      } else if (typed.type === 'saved') {
        dt.setData('arc/saved', '1');
      }
    }
    dt.setData('arc/request', '1');
    dt.setData('arc/source', this.localName);
    dt.effectAllowed = 'copy';

    this[reorderInfo] = {
      type: 'track',
      dragElement: node,
      dragIndex: index,
    };
  }

  // /**
  //  * @param {DragEvent} e
  //  */
  // [tabDragEndHandler](e) {
  //   if (this[reorderInfo] && this[reorderInfo].type === 'track') {
  //     console.log('aaaaaaaaaaaaaaaaaaaaaaaaaa');
  //   }
  // }

  [addNewHandler](e) {
    this.addEmpty();
    e.currentTarget.blur();
  }

  render() {
    return html`
    ${this[tabsTemplate]()}
    ${this[panelsTemplate]()}
    `
  }

  /**
   * @returns {TemplateResult} The template for the tabs list
   */
  [tabsTemplate]() {
    const { selected } = this;
    const items = this[tabsValue];
    return html`
    <workspace-tabs
      class="tabs"
      id="tabs"
      .selected="${selected}"
      @selected="${this[tabsSelectionHandler]}"
    >
      ${items.map((item, index) => this[tabTemplate](item, index))}
      <anypoint-icon-button
        class="add-request-button"
        @click="${this[addNewHandler]}"
        title="Add a new request to the workspace"
        aria-label="Activate to add new request"
        slot="suffix"
      >
        <arc-icon icon="add"></arc-icon>
      </anypoint-icon-button>
    </workspace-tabs>`;
  }

  /**
   * @param {WorkspaceTab} item
   * @param {number} index
   * @returns {TemplateResult} The template for the rendered request panel tab.
   */
  [tabTemplate](item, index) {
    // const { selected } = this;
    // const isSelected = selected === index;
    const classes = {
      // selected: isSelected,
      tab: true
    };
    return html`
    <workspace-tab
      data-index="${index}"
      draggable="true"
      class=${classMap(classes)}
      @dragstart="${this[tabDragStartHandler]}"
      @dragend="${this[tabDragEndHandler]}"
    >
      <span class="tab-name">${item.label}</span>
      <arc-icon class="close-icon" data-index="${index}" icon="close" @click="${this[closeRequestHandler]}"></arc-icon>
    </workspace-tab>
    <div class="tab-divider"></div>
    `;
    // ${isSelected ? '' : html`<div class="tab-divider"></div>`}
  }

  /**
   * @returns {TemplateResult} The template for all rendered panels in the workspace.
   */
  [panelsTemplate]() {
    const { selected } = this;
    const tab = this[tabsValue][selected];
    const requests = this[requestsValue];
    const selectedTabId = tab && tab.id;
    return html`
    <section class="workspace-panels">
    ${requests.map((request, index) => this[panelTemplate](request, index, selectedTabId))}
    </section>
    `;
  }

  /**
   * @param {WorkspaceRequest} request The request to render
   * @param {number} index Request index in the requests array
   * @param {string} selectedTabId The id of the selected tab.
   * @returns {TemplateResult} The template for a request panel
   */
  [panelTemplate](request, index, selectedTabId) {
    const visible = request.tab === selectedTabId;
    return html`
    <arc-request-panel
      ?hidden="${!visible}"
      ?compatibility="${this.compatibility}"
      .editorRequest="${request}"
      .oauth2RedirectUri="${this.oauth2RedirectUri}"
      @change="${this[requestChangeHandler]}"
      class="stacked"
      data-index="${index}"
      data-tab="${request.tab}"
      boundEvents
    ></arc-request-panel>
    `;
  }
}
