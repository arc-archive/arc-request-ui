import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@advanced-rest-client/arc-menu/saved-menu.js';
import '@advanced-rest-client/arc-menu/history-menu.js';
import '@advanced-rest-client/arc-menu/projects-menu.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/url-history-model.js';
import '@advanced-rest-client/arc-models/history-data-model.js';
import '@advanced-rest-client/arc-models/client-certificate-model.js';
import '@advanced-rest-client/arc-models/variables-model.js';
import '@advanced-rest-client/arc-models/auth-data-model.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog-scrollable.js';
import '@advanced-rest-client/client-certificates/certificate-import.js';
import '@advanced-rest-client/arc-ie/arc-data-export.js';
import { RequestFactory, ModulesRegistry, RequestAuthorization, ResponseAuthorization, ArcFetchRequest, RequestCookies } from '@advanced-rest-client/request-engine';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ImportEvents, ArcNavigationEventTypes, TransportEventTypes, TransportEvents, DataExportEventTypes, GoogleDriveEventTypes, WorkspaceEventTypes, ProjectActions, SessionCookieEventTypes } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import jexl from '../web_modules/jexl/dist/Jexl.js';
import listenEncoding from './EncodingHelpers.js';
import '../arc-request-workspace.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-events').ArcExportFilesystemEvent} ArcExportFilesystemEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceReadEvent} WorkspaceReadEvent */
/** @typedef {import('@advanced-rest-client/arc-events').WorkspaceWriteEvent} WorkspaceWriteEvent */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */

ModulesRegistry.register(ModulesRegistry.request, '@advanced-rest-client/request-engine/request/request-authorization', RequestAuthorization, ['store', 'events']);
ModulesRegistry.register(ModulesRegistry.response, '@advanced-rest-client/request-engine/response/request-authorization', ResponseAuthorization, ['store', 'events']);
ModulesRegistry.register(ModulesRegistry.request, '@advanced-rest-client/request-engine/request/cookies', RequestCookies.processRequestCookies, ['events']);
ModulesRegistry.register(ModulesRegistry.response, '@advanced-rest-client/request-engine/response/cookies', RequestCookies.processResponseCookies, ['events']);


// const WORKSPACE_STORE_KEY = 'demo.arc-request-ui.workspace';

class ComponentDemo extends DemoPage {
  get workspace() {
    return document.querySelector('arc-request-workspace');
  }

  constructor() {
    super();
    this.initObservableProperties([
      'withMenu', 'initialized', 'importingCertificate',
      'exportSheetOpened', 'exportFile', 'exportData',
      'workspaceId', 'renderSend', 'progressInfo',
    ]);
    this.componentName = 'ARC request workspace';
    this.compatibility = false;
    this.withMenu = false;
    this.initialized = false;
    this.importingCertificate = false;
    this.renderSend = false;
    this.progressInfo = false;
    this.workspaceId = 'default';
    
    this.generator = new DataGenerator();
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';
    
    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.factory = new RequestFactory(window, jexl);
    this.requestRunner = new ArcFetchRequest();
    this._closeImportHandler = this._closeImportHandler.bind(this);
    this._exportOpenedChanged = this._exportOpenedChanged.bind(this);
    window.addEventListener(DataExportEventTypes.fileSave, this.fileSaveHandler.bind(this))
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this.navigateRequestHandler.bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this.navigateHandler.bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this.navigateProjectHandler.bind(this));
    window.addEventListener(TransportEventTypes.request, this.makeRequest.bind(this));
    window.addEventListener(TransportEventTypes.abort, this.abortRequest.bind(this));
    window.addEventListener(TransportEventTypes.transport, this.transportRequest.bind(this));
    window.addEventListener(DataExportEventTypes.fileSave, this._fileExportHandler.bind(this));
    window.addEventListener(GoogleDriveEventTypes.save, this._fileExportHandler.bind(this));
    window.addEventListener(WorkspaceEventTypes.read, this._workspaceReadHandler.bind(this));
    window.addEventListener(WorkspaceEventTypes.write, this._workspaceWriteHandler.bind(this));
    window.addEventListener(SessionCookieEventTypes.update, (e) => {
      // @ts-ignore
      console.log('Cookie update', e.cookie);
    });
    
    this.initEditors();
    listenEncoding();

    this.renderViewControls = true;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkThemeActive = true;
    }
  }

  async initEditors() {
    await this.loadMonaco();
    this.initialized = true;
  }

  async generateData() {
    await this.generator.insertSavedRequestData({
      requestsSize: 100,
    });
    await this.generator.insertHistoryRequestData({
      requestsSize: 100,
    });
    ImportEvents.dataImported(document.body);
  }

  async deleteData() {
    await this.generator.destroySavedRequestData();
    await this.generator.destroyHistoryData();
    ArcModelEvents.destroyed(document.body, 'all');
  }

  /**
   * @param {WorkspaceReadEvent} e 
   */
  _workspaceReadHandler(e) {
    const { id } = e.detail;
    e.detail.result = this.readWorkspaceState(id);
  }

  /**
   * @param {WorkspaceWriteEvent} e 
   */
  _workspaceWriteHandler(e) {
    const { id, contents } = e.detail;
    e.detail.result = this.writeWorkspaceState(contents, id);
  }

  getWorkspaceKey(id) {
    return ['demo', 'arc-request-ui', 'workspace', id].join('.');
  }

  /**
   * Mimics ARC's reading workspace file.
   * @param {string} [id='default'] The id of the workspace
   * @returns {Promise<DomainWorkspace>}
   */
  async readWorkspaceState(id='default') {
    const key = this.getWorkspaceKey(id);
    const raw = localStorage.getItem(key);
    let result = /** @type DomainWorkspace */ (null);
    try {
      const data = JSON.parse(raw);
      if (data && data.kind === 'ARC#DomainWorkspace') {
        result = data;
      }
    } catch (e) {
      // ...
    }
    return result;
  }

  /**
   * Writes workspace data to the store.
   * @param {DomainWorkspace} data
   * @param {string} [id='default']
   * @returns {Promise<void>}
   */
  async writeWorkspaceState(data, id='default') {
    const key = this.getWorkspaceKey(id);
    const raw = JSON.stringify(data);
    localStorage.setItem(key, raw);
  }

  /**
   * @param {ARCRequestNavigationEvent} e 
   */
  navigateRequestHandler(e) {
    const { requestId, requestType, action } = e;
    if (action !== 'open') {
      return;
    }
    this.workspace.addByRequestId(requestType, requestId);
  }

  /**
   * @param {ARCProjectNavigationEvent} e
   */
  navigateProjectHandler(e) {
    const { id, action, route } = e;
    if (route !== 'project') {
      return;
    }
    if (action === ProjectActions.addWorkspace) {
      this.workspace.appendByProjectId(id);
    } else if (action === ProjectActions.replaceWorkspace) {
      this.workspace.replaceByProjectId(id);
    }
  }

  navigateHandler(e) {
    if (e.route === 'client-certificate-import') {
      this.importingCertificate = true;
    }
  }

  _closeImportHandler() {
    this.importingCertificate = false;
  }

  async loadMonaco() {
    const base = `../node_modules/monaco-editor/`;
    MonacoLoader.createEnvironment(base);
    await MonacoLoader.loadMonaco(base);
    await MonacoLoader.monacoReady();
  }

  async makeRequest(e) {
    const transportRequest = e.detail;
    try {
      const request = await this.factory.processRequest(transportRequest);
      TransportEvents.transport(document.body, request.id, request.request);
    } catch (ex) {
      TransportEvents.response(document.body, transportRequest.id, transportRequest.request, null, {
        error: ex,
        loadingTime: 0,
        status: 0,
      });
    }
  }

  /**
   * @param {ApiTransportEvent} e
   */
  async transportRequest(e) {
    const transportRequest = e.detail;
    const result = await this.requestRunner.execute(e.detail, e.detail.config);
    if (!result) {
      // the request has been aborted.
      TransportEvents.response(document.body, transportRequest.id, transportRequest.request, null, {
        error: new Error('Request timeout'),
        loadingTime: 0,
        status: 0,
      });
      return;
    }

    await this.factory.processResponse(result.request, result.transport, result.response);
    TransportEvents.response(document.body, transportRequest.id, transportRequest.request, result.transport, result.response);

    console.log(result);
  }

  abortRequest(e) {
    const { id } = e.detail;
    this.factory.abort(id);
    this.requestRunner.abort(id);
  }

  /** 
   * @param {ArcExportFilesystemEvent} e
   */
  fileSaveHandler(e) {
    const { data, providerOptions  } = e;
    const a = document.createElement('a');
    const blob = new Blob([data], { type: providerOptions.contentType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = providerOptions.file;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);  
    }, 0); 
  }

  /**
   * @param {ArcExportFilesystemEvent} e
   */
  _fileExportHandler(e) {
    const { providerOptions, data } = e;
    const { file } = providerOptions;
    
    setTimeout(() => {
      try {
        this.exportData = JSON.stringify(JSON.parse(data), null, 2);
      } catch (_) {
        this.exportData = data;
      }
      this.exportFile = file;
      this.exportSheetOpened = true;
    });
    e.preventDefault();
    e.detail.result = Promise.resolve({
      fileId: file,
      success: true,
      interrupted: false,
      parentId: null,
    });
  }

  _exportOpenedChanged() {
    this.exportSheetOpened = false;
  }

  _demoTemplate() {
    if (!this.initialized) {
      return html`<progress></progress>`;
    }
    const {
      compatibility,
      withMenu,
      oauth2RedirectUri,
      workspaceId,
      renderSend,
      progressInfo,
    } = this;
    return html`
    <section class="documentation-section">
      <div class="demo-app">
        ${withMenu ? html`<nav>
          <saved-menu ?compatibility="${compatibility}" draggableEnabled></saved-menu>
          <history-menu ?compatibility="${compatibility}" draggableEnabled></history-menu>
          <projects-menu ?compatibility="${compatibility}" draggableEnabled></projects-menu>
        </nav>` : ''}
        
        <arc-request-workspace
          ?compatibility="${compatibility}"
          ?renderSend="${renderSend}"
          ?progressInfo="${progressInfo}"
          .oauth2RedirectUri="${oauth2RedirectUri}"
          backendId="${workspaceId}"
          autoRead
        ></arc-request-workspace>
      </div>
    </section>
    `;
  }

  _dataControlsTemplate() {
    return html`
    <section class="documentation-section">
      <h3>Data control</h3>
      <p>
        This section allows you to control demo data
      </p>
      <anypoint-button @click="${this.generateData}">Generate data</anypoint-button>
      <anypoint-button @click="${this.deleteData}">Clear list</anypoint-button>
      <anypoint-checkbox
        aria-describedby="mainOptionsLabel"
        slot="options"
        name="withMenu"
        @change="${this._toggleMainOption}"
        title="Uses request objects instead of request ids"
      >
        Render menu
      </anypoint-checkbox>
      <anypoint-checkbox
        aria-describedby="mainOptionsLabel"
        slot="options"
        name="renderSend"
        @change="${this._toggleMainOption}"
        title="Renders the send button on the request editor"
      >
        Render send button
      </anypoint-checkbox>
      <anypoint-checkbox
        aria-describedby="mainOptionsLabel"
        slot="options"
        name="progressInfo"
        @change="${this._toggleMainOption}"
        title="Renders the status when sending the request"
      >
        Render transport info
      </anypoint-checkbox>
    </section>`;
  }

  _certImportTemplate() {
    const { importingCertificate } = this;
    return html`
    <anypoint-dialog ?opened="${importingCertificate}">
      <anypoint-dialog-scrollable>
        <certificate-import @close="${this._closeImportHandler}"></certificate-import>
      </anypoint-dialog-scrollable>
    </anypoint-dialog>
    `;
  }

  exportTemplate() {
    const { exportSheetOpened, exportFile, exportData } = this;
    return html`
    <bottom-sheet
      .opened="${exportSheetOpened}"
      @closed="${this._exportOpenedChanged}">
      <h3>Export demo</h3>
      <p>This is a preview of the file. Normally export module would save this data to file / Drive.</p>
      <p>File: ${exportFile}</p>
      <pre>${exportData}</pre>
    </bottom-sheet>
    `;
  }

  contentTemplate() {
    return html`
      <project-model></project-model>
      <request-model></request-model>
      <url-history-model></url-history-model>
      <history-data-model></history-data-model>
      <client-certificate-model></client-certificate-model>
      <variables-model></variables-model>
      <auth-data-model></auth-data-model>
      <arc-data-export appVersion="demo-page"></arc-data-export>
      ${this._demoTemplate()}
      ${this._dataControlsTemplate()}
      ${this._certImportTemplate()}
      ${this.exportTemplate()}
    `;
  }
}

const instance = new ComponentDemo();
instance.render();
