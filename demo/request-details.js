import { html } from 'lit-html';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@advanced-rest-client/arc-menu/saved-menu.js';
import '@advanced-rest-client/arc-menu/history-menu.js';
import '@advanced-rest-client/arc-models/request-model.js';
import '@advanced-rest-client/arc-models/project-model.js';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { ArcModelEvents, ArcModelEventTypes, ImportEvents, ArcNavigationEventTypes } from '@advanced-rest-client/arc-events';
import '../request-meta-details.js';

/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestNavigationEvent} ARCRequestNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCProjectNavigationEvent} ARCProjectNavigationEvent */
/** @typedef {import('@advanced-rest-client/arc-events').ARCRequestDeletedEvent} ARCRequestDeletedEvent */

class ComponentDemo extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties(['request', 'requestId', 'requestType', 'useObjects']);
    this.componentName = 'request-meta-details';
    this.compatibility = false;
    this.useObjects = false;
    this.request = undefined;
    this.requestId = undefined;
    this.requestType = undefined;
    this.generator = new DataGenerator();
    this.renderViewControls = true;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkThemeActive = true;
    }

    this.generateData = this.generateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
    this.editHandler = this.editHandler.bind(this);
    this.randomHandler = this.randomHandler.bind(this);
    this._selectRequest = this._selectRequest.bind(this);
    window.addEventListener(ArcNavigationEventTypes.navigateRequest, this.navigateRequestHandler.bind(this));
    window.addEventListener(ArcNavigationEventTypes.navigateProject, this.navigateProjectHandler.bind(this));
    window.addEventListener(ArcModelEventTypes.Request.State.delete, this.requestDeleteHandler.bind(this));
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

  editHandler() {
    console.log('edit requested');
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

  /**
   * Sets a request data on the details element
   * @param {string} id The request id
   * @param {string} type The request type
   */
  async setRequest(id, type) {
    const { useObjects } = this;
    this.request = undefined;
    this.requestId = undefined;
    this.requestType = undefined;
    if (useObjects) {
      this.request = await ArcModelEvents.Request.read(document.body, type, id);
    } else {
      this.requestId = id;
      this.requestType = type;
    }
  }

  randomHandler() {
    if (Date.now() % 2 === 0) {
      this.request = this.generator.generateSavedItem();
    } else {
      this.request = this.generator.generateHistoryObject();
    }
    this.requestId = undefined;
    this.requestType = undefined;
  }

  /**
   * @param {ARCProjectNavigationEvent} e 
   */
  navigateProjectHandler(e) {
    console.log('Project navigation', e.id, e.route, e.action);
  }

  /**
   * @param {ARCRequestDeletedEvent} e
   */
  requestDeleteHandler(e) {
    const { id } = e;
    if (id === this.requestId) {
      this.requestId = undefined;
      this.requestType = undefined;
    }
  }

  async _selectRequest(e) {
    this.request = await ArcModelEvents.Request.read(document.body, 'saved', e.detail.id);
  }

  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      compatibility,
      request,
      requestId,
      requestType,
      useObjects,
    } = this;
    const hasSelection = useObjects ? !!request : !!requestId;
    return html`
      <section class="documentation-section">
        <h3>Interactive demo</h3>
        <p>
          This demo lets you preview the request meta details element with various
          configuration options.
        </p>

        <arc-interactive-demo
          .states="${demoStates}"
          @state-changed="${this._demoStateHandler}"
          ?dark="${darkThemeActive}"
        >
          <div class="demo-app" slot="content">
            <nav>
              <saved-menu ?compatibility="${compatibility}"></saved-menu>
              <history-menu ?compatibility="${compatibility}"></history-menu>
            </nav>
            ${hasSelection ? html`
            <request-meta-details
              ?compatibility="${compatibility}"
              .requestType="${requestType}"
              .requestId="${requestId}"
              .request="${request}"
              @edit="${this.editHandler}"
            ></request-meta-details>` : 
            html`<p class="empty-info">Select a request to see a demo</p>` }
          </div>

          <label slot="options" id="mainOptionsLabel">Options</label>
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="useObjects"
            @change="${this._toggleMainOption}"
            title="Uses request objects instead of request ids"
          >
            Use objects
          </anypoint-checkbox>
          ${useObjects ? html`
          <anypoint-button
            slot="options"
            title="Generate random and unsaved request"
            @click="${this.randomHandler}"
          >Random request</anypoint-button>
          ` : ''}
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
      ${this._demoTemplate()}
      ${this._dataControlsTemplate()}
    `;
  }
}

const instance = new ComponentDemo();
instance.render();
