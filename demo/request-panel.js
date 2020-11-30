import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import { v4 } from '@advanced-rest-client/uuid-generator';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@advanced-rest-client/arc-menu/saved-menu.js';
import '@advanced-rest-client/arc-menu/history-menu.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import '@advanced-rest-client/arc-models/url-history-model.js';
import '@advanced-rest-client/arc-models/client-certificate-model.js';
import '@advanced-rest-client/arc-models/variables-model.js';
import '@advanced-rest-client/arc-models/auth-data-model.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog-scrollable.js';
import '@advanced-rest-client/client-certificates/certificate-import.js';
import '@advanced-rest-client/arc-ie/arc-data-export.js';
import { RequestFactory, ModulesRegistry, RequestAuthorization, ResponseAuthorization, ArcFetchRequest } from '@advanced-rest-client/request-engine';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ImportEvents, ArcNavigationEventTypes, TransportEventTypes, TransportEvents, DataExportEventTypes, GoogleDriveEventTypes } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import jexl from '../web_modules/jexl/dist/Jexl.js';
import listenEncoding from './EncodingHelpers.js';
import '../arc-request-panel.js';
import '../request-meta-details.js';
import '../request-meta-editor.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-events').ArcExportFilesystemEvent} ArcExportFilesystemEvent */

ModulesRegistry.register(ModulesRegistry.request, '@advanced-rest-client/request-engine/request/request-authorization', RequestAuthorization, ['storage']);
ModulesRegistry.register(ModulesRegistry.response, '@advanced-rest-client/request-engine/response/request-authorization', ResponseAuthorization, ['storage', 'events']);


const REQUEST_STORE_KEY = 'demo.arc-request-ui.editorRequest';

class ComponentDemo extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'request', 'requestId', 'withMenu', 'initialized', 'importingCertificate',
      'exportSheetOpened', 'exportFile', 'exportData'
    ]);
    this.componentName = 'ARC request editor';
    this.compatibility = false;
    this.withMenu = false;
    this.initialized = false;
    this.importingCertificate = false;
    /** 
     * @type {ArcEditorRequest}
     */
    this.request = {
      id: undefined,
      request: {
        url: window.location.href,
        method: 'GET',
      },
    };
    this.requestId = undefined;
    this.requestType = undefined;
    this.generator = new DataGenerator();
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';
    this.url = '';
    // this.url = window.location.href;
    // this.url = 'https://xd.adobe.com/view/46b6a75a-0dfd-44ff-87c1-e1b843d03911-13e5/';
    // this.url = 'https://httpbin.org/brotli';
    // this.url = 'json.json';

    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.factory = new RequestFactory(window, jexl);
    this.requestRunner = new ArcFetchRequest();
    this._closeImportHandler = this._closeImportHandler.bind(this);
    this.urlKeyHandler = this.urlKeyHandler.bind(this);
    this._exportOpenedChanged = this._exportOpenedChanged.bind(this);
    window.addEventListener(DataExportEventTypes.fileSave, this.fileSaveHandler.bind(this))
    
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this.navigateRequestHandler.bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this.navigateHandler.bind(this));
    window.addEventListener(TransportEventTypes.request, this.makeRequest.bind(this));
    window.addEventListener(TransportEventTypes.abort, this.abortRequest.bind(this));
    window.addEventListener(TransportEventTypes.transport, this.transportRequest.bind(this));
    window.addEventListener(DataExportEventTypes.fileSave, this._fileExportHandler.bind(this));
    window.addEventListener(GoogleDriveEventTypes.save, this._fileExportHandler.bind(this));
    
    this.initEditors();
    this.restoreRequest();
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
   * @param {ARCRequestNavigationEvent} e 
   */
  navigateRequestHandler(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (['saved-menu', 'history-menu'].includes(node.localName)) {
      this.setRequest(e.requestId, e.requestType);
    } else {
      console.log('Navigate request', e.requestId, e.requestType, e.route, e.action);
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

  /**
   * Sets a request data on the details element
   * @param {string} id The request id
   * @param {string} type The request type
   */
  async setRequest(id, type) {
    // this.request = undefined;
    this.requestId = id;
    this.requestType = type;
    const request = await ArcModelEvents.Request.read(document.body, type, id);
    this.request = {
      id: v4(),
      request,
    };
  }

  restoreRequest() {
    const data = localStorage.getItem(REQUEST_STORE_KEY);
    if (!data) {
      return;
    }
    try {
      const tmp = JSON.parse(data);
      if (tmp.id && tmp.request) {
        this.request = /** @type ArcEditorRequest */ (tmp);
      }
    } catch (e) {
      // 
    }
  }

  _requestChangeHandler() {
    const panel = document.querySelector('arc-request-panel');
    console.log('storing request data', panel.editorRequest);
    this.request = panel.editorRequest;

    localStorage.setItem(REQUEST_STORE_KEY, JSON.stringify(panel.editorRequest));
  }

  async makeRequest(e) {
    const transportRequest = e.detail;
    const request = await this.factory.processRequest(transportRequest);
    TransportEvents.transport(document.body, request.id, request.request);
  }

  /**
   * @param {ApiTransportEvent} e
   */
  async transportRequest(e) {
    const transportRequest = e.detail;
    const result = await this.requestRunner.execute(e.detail, e.detail.config);
    if (!result) {
      // the request has been aborted.
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
   * @param {KeyboardEvent} e
   */
  urlKeyHandler(e) {
    if (!['Enter', 'NumpadEnter'].includes(e.code)) {
      return;
    }
    const { value } = /** @type HTMLInputElement */ (e.target);
    this.request = {
      id: v4(),
      request: {
        method: 'GET',
        url: value,
      }
    };
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
      request,
      withMenu,
      oauth2RedirectUri,
    } = this;
    return html`
      <section class="documentation-section">
        <div class="demo-app">
          ${withMenu ? html`<nav>
            <saved-menu ?compatibility="${compatibility}"></saved-menu>
            <history-menu ?compatibility="${compatibility}"></history-menu>
          </nav>` : ''}
          
          <arc-request-panel
            ?compatibility="${compatibility}"
            .editorRequest="${request}"
            .oauth2RedirectUri="${oauth2RedirectUri}"
            @change="${this._requestChangeHandler}"
            class="stacked"
          ></arc-request-panel>
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

  demoRequest() {
    const jsonUrl = new URL('json.json', window.location.href).toString();
    return html`
    <section class="documentation-section">
      <h3>Demo request</h3>
      <input 
        type="url" 
        .value="${this.url}" 
        @keydown="${this.urlKeyHandler}" 
        class="url-input"
        list="inputOptions"
        aria-label="Enter the URL value"
      />
      <datalist id="inputOptions">
        <option value="${jsonUrl}"></option>
        <option value="https://xd.adobe.com/view/46b6a75a-0dfd-44ff-87c1-e1b843d03911-13e5/"></option>
        <option value="${window.location.href}"></option>
        <option value="https://httpbin.org/brotli"></option>
        <option value="https://httpbin.org/bytes/1000"></option>
        <option value="https://httpbin.org/image/svg"></option>
        <option value="https://httpbin.org/status/404"></option>
        <option value="https://httpbin.org/delay/2"></option>
      </datalist>
    </section>
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
      <client-certificate-model></client-certificate-model>
      <variables-model></variables-model>
      <auth-data-model></auth-data-model>
      <arc-data-export appVersion="demo-page"></arc-data-export>
      ${this._demoTemplate()}
      ${this._dataControlsTemplate()}
      ${this.demoRequest()}
      ${this._certImportTemplate()}
      ${this.exportTemplate()}
    `;
  }
}

const instance = new ComponentDemo();
instance.render();
