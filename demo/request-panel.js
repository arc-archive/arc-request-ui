import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
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
import { RequestFactory, ModulesRegistry, RequestAuthorization, ResponseAuthorization, ArcFetchRequest } from '@advanced-rest-client/request-engine';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ImportEvents, ArcNavigationEventTypes, TransportEventTypes, TransportEvents } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import { v4 } from '@advanced-rest-client/uuid-generator';
import jexl from '../web_modules/jexl/dist/Jexl.js'
import '../arc-request-panel.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */

ModulesRegistry.register(ModulesRegistry.request, '@advanced-rest-client/request-engine/request/request-authorization', RequestAuthorization, ['storage']);
ModulesRegistry.register(ModulesRegistry.response, '@advanced-rest-client/request-engine/response/request-authorization', ResponseAuthorization, ['storage', 'events']);


const REQUEST_STORE_KEY = 'demo.arc-request-ui.editorRequest';

class ComponentDemo extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties(['request', 'requestId', 'withMenu', 'initialized', 'importingCertificate']);
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
      request: undefined,
    };
    this.requestId = undefined;
    this.requestType = undefined;
    this.generator = new DataGenerator();
    this.oauth2RedirectUri = 'http://auth.advancedrestclient.com/arc.html';

    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.factory = new RequestFactory(window, jexl);
    this._closeImportHandler = this._closeImportHandler.bind(this);
    
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this.navigateRequestHandler.bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigate, this.navigateHandler.bind(this));
    window.addEventListener(TransportEventTypes.request, this.makeRequest.bind(this));
    
    this.initEditors();
    this.restoreRequest();

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
    console.log(panel.editorRequest);

    localStorage.setItem(REQUEST_STORE_KEY, JSON.stringify(panel.editorRequest));
  }

  async makeRequest(e) {
    const transportRequest = e.detail;
    const request = await this.factory.processRequest(transportRequest);
    const runner = new ArcFetchRequest();
    const result = await runner.execute(request);

    await this.factory.processResponse(result.request, result.transport, result.response);
    TransportEvents.response(document.body, transportRequest.id, transportRequest.request, result.transport, result.response);
    console.log(result);
  }

  _demoTemplate() {
    if (!this.initialized) {
      return html`<progress></progress>`;
    }
    const {
      demoStates,
      darkThemeActive,
      compatibility,
      request,
      withMenu,
      oauth2RedirectUri,
    } = this;

    return html`
      <section class="documentation-section">
        <h3>Interactive demo</h3>
        <p>
          This demo lets you preview the HTTP request editor element with various configuration options.
        </p>

        <arc-interactive-demo
          .states="${demoStates}"
          @state-changed="${this._demoStateHandler}"
          ?dark="${darkThemeActive}"
        >
          <div class="demo-app" slot="content">
            ${withMenu ? html`<nav>
              <saved-menu ?compatibility="${compatibility}"></saved-menu>
              <history-menu ?compatibility="${compatibility}"></history-menu>
            </nav>` : ''}
            
            <arc-request-panel
              ?compatibility="${compatibility}"
              .editorRequest="${request}"
              .oauth2RedirectUri="${oauth2RedirectUri}"
              @change="${this._requestChangeHandler}"
            ></arc-request-panel>
          </div>
        </arc-interactive-demo>
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

  contentTemplate() {
    return html`
      <h2>ARC request panel</h2>
      <project-model></project-model>
      <request-model></request-model>
      <url-history-model></url-history-model>
      <client-certificate-model></client-certificate-model>
      <variables-model></variables-model>
      <auth-data-model></auth-data-model>
      ${this._demoTemplate()}
      ${this._dataControlsTemplate()}
      ${this._certImportTemplate()}
    `;
  }
}

const instance = new ComponentDemo();
instance.render();
