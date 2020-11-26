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
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ImportEvents, ArcNavigationEventTypes } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import '../arc-request-editor.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-models').ARCRequestDeletedEvent} ARCRequestDeletedEvent */

class ComponentDemo extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties(['request', 'requestId', 'withMenu', 'initialized']);
    this.componentName = 'ARC request editor';
    this.compatibility = false;
    this.withMenu = false;
    this.initialized = false;
    this.request = undefined;
    this.requestId = undefined;
    this.requestType = undefined;
    this.generator = new DataGenerator();

    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this.navigateRequestHandler.bind(this));
    
    this.initEditors();
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
    this.request = undefined;
    this.requestId = id;
    this.requestType = type;
    this.request = await ArcModelEvents.Request.read(document.body, type, id);
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
      requestId,
      requestType,
      withMenu,
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
            
            <arc-request-editor
              ?compatibility="${compatibility}"
            ></arc-request-editor>
          </div>

          <label slot="options" id="mainOptionsLabel">Options</label>
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="withMenu"
            @change="${this._toggleMainOption}"
            title="Uses request objects instead of request ids"
          >
            Render menu
          </anypoint-checkbox>
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

  contentTemplate() {
    return html`
      <h2>ARC request meta details</h2>
      <project-model></project-model>
      <request-model></request-model>
      <url-history-model></url-history-model>
      ${this._demoTemplate()}
      ${this._dataControlsTemplate()}
    `;
  }
}

const instance = new ComponentDemo();
instance.render();
