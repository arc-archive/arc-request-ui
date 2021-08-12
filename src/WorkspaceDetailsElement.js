/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import '@github/time-elements';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/highlight/arc-marked.js';
import markdownStyles from '@advanced-rest-client/markdown-styles/markdown-styles.js';
import styles from './styles/WorkspaceDetails.js';
import {
  editHandler,
  descriptionTemplate,
} from './internals.js';

export const noDataTemplate = Symbol('noDataTemplate');
export const valueTemplate = Symbol('valueTemplate');

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */

export class WorkspaceDetailsElement extends ArcResizableMixin(LitElement) {
  static get styles() {
    return [
      markdownStyles,
      styles
    ];
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
    };
  }

  constructor() {
    super();
    /** 
     * @type {DomainWorkspace}
     */
    this.workspace = undefined;

    this.compatibility = false;
  }

  /**
   * Sends non-bubbling `edit` event to the parent element to perform
   * edit action.
   */
  [editHandler]() {
    this.dispatchEvent(new CustomEvent('edit'));
  }

  render() {
    const { workspace, compatibility } = this;
    if (!workspace) {
      return html``;
    }

    const { meta={}, provider={} } = workspace;
    const { version, published, } = meta;
    const { email, url, name: providerName } = provider;

    return html`
    <h2 class="title">Workspace details</h2>
    ${this[descriptionTemplate]()}
    <div class="meta-row">
      <div class="label">
        Version
      </div>
      ${this[valueTemplate](version)}
    </div>

    <div class="meta-row">
      <div class="label">
        Published
      </div>
      ${published ? html`<div class="value">
        <relative-time datetime="${published}"></relative-time> at
        <local-time datetime="${published}" hour="numeric" minute="numeric" second="numeric"></local-time>
      </div>` : this[noDataTemplate]()}
    </div>

    <h3>Provider</h3>

    <div class="meta-row">
      <div class="label">
        Author
      </div>
      ${this[valueTemplate](providerName)}
    </div>

    <div class="meta-row">
      <div class="label">
        Address
      </div>
      ${this[valueTemplate](url)}
    </div>

    <div class="meta-row">
      <div class="label">
        Contact
      </div>
      ${this[valueTemplate](email)}
    </div>

    <div class="actions">
      <anypoint-button
        @click="${this[editHandler]}"
        data-action="edit-meta"
        title="Opens workspace editor"
        ?compatibility="${compatibility}"
      >
        <arc-icon icon="edit"></arc-icon>
        Edit
      </anypoint-button>
    </div>`;
  }

  /**
   * @returns {TemplateResult|string} The template for the workspace description 
   */
  [descriptionTemplate]() {
    const { workspace } = this;
    const { meta={} } = workspace;
    const { description } = meta;
    if (!description) {
      return '';
    }
    return html`
    <arc-marked .markdown="${description}" sanitize>
      <div class="markdown-html markdown-body description"></div>
    </arc-marked>
    `;
  }

  /**
   * @returns {TemplateResult} 
   */
  [noDataTemplate]() {
    return html`<div class="value empty">No data</div>`;
  }

  /**
   * @param {string} value
   * @returns {TemplateResult} 
   */
  [valueTemplate](value) {
    return value ? html`<div class="value">${value}</div>` : this[noDataTemplate]();
  }
}
