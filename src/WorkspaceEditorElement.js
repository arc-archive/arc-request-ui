/* eslint-disable lit-a11y/click-events-have-key-events */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html } from 'lit-element';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { MonacoTheme, MonacoStyles } from '@advanced-rest-client/monaco-support';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-collapse/anypoint-collapse.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@polymer/iron-form/iron-form.js';
import styles from './styles/WorkspaceEditor.js';
import {
  descriptionTemplate,
  submitHandler,
  cancelHandler,
  saveHandler,
  versionTemplate,
  publishedTemplate,
  additionalTemplate,
  actionsTemplate,
  providerNameTemplate,
  providerUrlTemplate,
  providerEmailTemplate,
} from './internals.js';

export const toggleOptions = Symbol('toggleOptions');
export const generateEditorConfig = Symbol('generateEditorConfig');
export const monacoValueChanged = Symbol('monacoValueChanged');
export const monacoInstance = Symbol('monacoInstance');
export const workspaceChanged = Symbol('workspaceChanged');
export const workspaceValue = Symbol('workspaceValue');

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */
/** @typedef {import('monaco-editor').editor.IStandaloneEditorConstructionOptions} IStandaloneEditorConstructionOptions */

/* global  monaco */

export class WorkspaceEditorElement extends ArcResizableMixin(LitElement) {
  static get styles() {
    return [
      styles,
      MonacoStyles,
    ];
  }

  /** 
   * @returns {DomainWorkspace}
   */
  get workspace() {
    return this[workspaceValue];
  }

  /** 
   * @param {DomainWorkspace=} value
   */
  set workspace(value) {
    const old = this[workspaceValue];
    if (old === value) {
      return;
    }
    const effectiveValue = value || { kind: 'ARC#DomainWorkspace' };
    this[workspaceValue] = effectiveValue;
    this[workspaceChanged](effectiveValue);
    this.requestUpdate('workspace', old);
  }

  static get properties() {
    return {
      /**
       * The workspace object being rendered
       */
      workspace: { type: Object },
      /**
       * Enables compatibility with Anypoint platform
       */
      compatibility: { type: Boolean },
      /**
       * Enables material's outlined theme for inputs.
       */
      outlined: { type: Boolean },
      /**
       * Toggles additional options
       */
      providerInfoOpened: { type: Boolean },
    };
  }

  constructor() {
    super();
    /** 
     * @type {DomainWorkspace}
     */
    this[workspaceValue] = {
      kind: 'ARC#DomainWorkspace',
    };

    this.compatibility = false;
    this.outlined = false;
  }

  /**
   * @param {Map<string | number | symbol, unknown>} args
   */
  firstUpdated(args) {
    super.firstUpdated(args);
    const config = this[generateEditorConfig]();
    // @ts-ignore
    const instance = monaco.editor.create(this.shadowRoot.querySelector('.monaco'), config);
    this[monacoInstance] = instance;
  }

  /**
   * @param {DomainWorkspace=} workspace
   */
  [workspaceChanged](workspace) {
    if (!workspace || !this[monacoInstance]) {
      return;
    }
    const { meta={} } = workspace;
    const { description='' } = meta;
    this[monacoInstance].setValue(description);
  }

  [toggleOptions]() {
    this.providerInfoOpened = !this.providerInfoOpened;
  }

  /**
   * Sends the `cancel` custom event to cancel the edit.
   */
  [cancelHandler]() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  /**
   * Dispatches the save event with updated workspace.
   */
  [saveHandler]() {
    this.send();
  }

  /**
   * Serializes values into a form.
   * @returns {DomainWorkspace} [description]
   */
  serializeForm() {
    const { workspace } = this;
    const form = this.shadowRoot.querySelector('iron-form');
    const values = form.serializeForm();
    if (!workspace.meta) {
      workspace.meta = {};
    }
    if (!workspace.provider) {
      workspace.provider = {};
    }
    if (values['provider.email'] !== undefined) {
      workspace.provider.email = values['provider.email'];
    }
    if (values['provider.name'] !== undefined) {
      workspace.provider.name = values['provider.name'];
    }
    if (values['provider.url'] !== undefined) {
      workspace.provider.url = values['provider.url'];
    }
    if (values['meta.published'] !== undefined) {
      workspace.meta.published = values['meta.published'];
    }
    if (values['meta.version'] !== undefined) {
      workspace.meta.version = values['meta.version'];
    }
    const value = this[monacoInstance].getValue();
    workspace.meta.description = value;
    return workspace;
  }

  [generateEditorConfig]() {
    const { workspace } = this;
    const { meta={} } = workspace;
    const { description='' } = meta;
    let config = /** IStandaloneEditorConstructionOptions */ ({
      minimap: {
        enabled: false,
      },
      formatOnType: true,
      folding: true,
      tabSize: 2,
      detectIndentation: true,
      value: description,
    });
    // @ts-ignore
    config = MonacoTheme.assignTheme(monaco, config);
    config.language = 'markdown';
    return config;
  }

  /**
   * Sends the `save` custom event with computed detail object.
   *
   * @param {CustomEvent} e
   */
  [submitHandler](e) {
    e.preventDefault();
    const workspace = this.serializeForm();
    this.dispatchEvent(new CustomEvent('store', {
      detail: workspace,
    }));
  }

  /**
   * Validates and submits the form.
   */
  send() {
    const form = this.shadowRoot.querySelector('iron-form');
    if (!form.validate()) {
      return;
    }
    form.submit();
  }

  render() {
    return html`
    <h2 class="title">Edit workspace details</h2>
    <iron-form id="form" @iron-form-presubmit="${this[submitHandler]}">
    <form method="POST">
      ${this[descriptionTemplate]()}
      ${this[versionTemplate]()}
      ${this[publishedTemplate]()}
      ${this[additionalTemplate]()}
      ${this[actionsTemplate]()}
    </form>
    </iron-form>`;
  }

  /**
   * @returns {TemplateResult} The template for the description input.
   */
  [descriptionTemplate]() {
    return html`
    <div class="monaco-wrap">
      <label>Description (markdown)</label>
      <div class="monaco"></div>
    </div>`;
  }

  /**
   * @returns {TemplateResult} The template for the version input.
   */
  [versionTemplate]() {
    const { compatibility, outlined, workspace } = this;
    const { meta={} } = workspace;
    return html`
    <anypoint-input
      name="meta.version"
      .value="${meta.version}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Version</label>
    </anypoint-input>`;
  }

  /**
   * @returns {TemplateResult} The template for the published time input.
   */
  [publishedTemplate]() {
    const {
      compatibility,
      outlined,
      workspace,
    } = this;
    const { meta={} } = workspace;
    const { published } = meta;
    return html`
    <anypoint-input
      name="meta.published"
      .value="${published}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      type="datetime-local"
    >
      <label slot="label">Published</label>
    </anypoint-input>`;
  }

  /**
   * @returns {TemplateResult} The template for the workspace additional meta
   */
  [additionalTemplate]() {
    const { providerInfoOpened } = this;
    return html`
    <section class="additional-options">
      <div
        class="caption"
        @click="${this[toggleOptions]}"
        ?data-caption-opened="${providerInfoOpened}"
      >
        Provider info
        <anypoint-icon-button
          class="caption-icon"
          aria-label="Activate to toggle additional options"
        >
          <arc-icon icon="arrowDropDown"></arc-icon>
        </anypoint-icon-button>
      </div>
      <anypoint-collapse .opened="${providerInfoOpened}">
        <div class="options">
          ${this[providerNameTemplate]()}
          ${this[providerUrlTemplate]()}
          ${this[providerEmailTemplate]()}
        </div>
      </anypoint-collapse>
    </section>`;
  }

  /**
   * @returns {TemplateResult} The template for the provider name value.
   */
  [providerNameTemplate]() {
    const { compatibility, outlined, workspace } = this;
    const { provider={} } = workspace;
    const { name } = provider;
    return html`
    <anypoint-input
      name="provider.name"
      .value="${name}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Author</label>
    </anypoint-input>`;
  }

  /**
   * @returns {TemplateResult} The template for the provider URL value.
   */
  [providerUrlTemplate]() {
    const { compatibility, outlined, workspace } = this;
    const { provider={} } = workspace;
    const { url } = provider;
    return html`
    <anypoint-input
      name="provider.url"
      .value="${url}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Website</label>
    </anypoint-input>`;
  }

  /**
   * @returns {TemplateResult} The template for the provider email value.
   */
  [providerEmailTemplate]() {
    const { compatibility, outlined, workspace } = this;
    const { provider={} } = workspace;
    const { email } = provider;
    return html`
    <anypoint-input
      name="provider.email"
      .value="${email}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Email</label>
    </anypoint-input>`;
  }

  /**
   * @returns {TemplateResult} The template for the action buttons
   */
  [actionsTemplate]() {
    const { compatibility } = this;
    return html`
    <div class="actions">
      <anypoint-button
        @click="${this[cancelHandler]}"
        data-action="cancel-edit"
        title="Cancels any changes"
        ?compatibility="${compatibility}"
      >Cancel</anypoint-button>
      <anypoint-button
        class="action-button"
        @click="${this[saveHandler]}"
        data-action="save"
        title="Save workspace data"
        ?compatibility="${compatibility}"
      >Save</anypoint-button>
    </div>
    `;
  }
}
