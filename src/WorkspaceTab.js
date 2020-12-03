import { LitElement, html } from 'lit-element';
import elementStyles from './styles/Tab.js';

export class WorkspaceTab extends LitElement {
  static get styles() {
    return elementStyles;
  }

  connectedCallback() {
    super.connectedCallback();
    /* istanbul ignore else */
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'tab');
    }
  }

  render() {
    return html`
      <div class="left-decorator"></div>
      <div class="left-decorator-clip"></div>
      <slot></slot>
      <div class="right-decorator"></div>
      <div class="right-decorator-clip"></div>
    `;
  }
}
