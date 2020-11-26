import { html } from 'lit-element';
import '@anypoint-web-components/anypoint-menu-button/anypoint-menu-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */

function menuClosed(e) {
  const menu = e.target;
  setTimeout(() => {
    const listbox = menu.querySelector('anypoint-listbox');
    listbox.selected = undefined;
  });
}

/**
 * @param {Function} handler The menu selection handler
 * @param {boolean=} compatibility 
 * @returns {TemplateResult} The template for the drop down options next to the URL editor
 */
export default function requestMenuTemplate(handler, compatibility=false) {
  return html`
  <anypoint-menu-button
    class="request-menu"
    closeOnActivate
    horizontalAlign="right"
    ?compatibility="${compatibility}"
    @dropdownclose="${menuClosed}"
  >
    <anypoint-icon-button
      aria-label="Activate to open request's context menu"
      slot="dropdown-trigger"
      ?compatibility="${compatibility}"
    >
      <arc-icon icon="moreVert"></arc-icon>
    </anypoint-icon-button>
    <anypoint-listbox
      slot="dropdown-content"
      class="options-menu"
      ?compatibility="${compatibility}"
      selectable="anypoint-icon-item"
      @selected="${handler}"
    >
      <anypoint-icon-item
        class="menu-item"
        title="Clear the request editor"
        data-action="clear"
        tabindex="-1"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="close"></arc-icon>
        Clear editor
      </anypoint-icon-item>
      <anypoint-icon-item
        class="menu-item"
        title="Save the current request in the application"
        tabindex="-1"
        data-action="save"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="save"></arc-icon>
        Save
      </anypoint-icon-item>
      <anypoint-icon-item
        class="menu-item"
        title="Export this request"
        tabindex="-1"
        data-action="export"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="exportVariant"></arc-icon>
        Export
      </anypoint-icon-item>

      <anypoint-icon-item
        class="menu-item"
        title="Show request details"
        tabindex="-1"
        data-action="details"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="infoOutline"></arc-icon>
        Details
      </anypoint-icon-item>

      <div class="separator"></div>

      <anypoint-icon-item
        class="menu-item"
        title="Close this request"
        tabindex="-1"
        data-action="close"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="close"></arc-icon>
        Close
      </anypoint-icon-item>
      
      <anypoint-icon-item
        class="menu-item"
        title="Duplicate this request in another tab"
        tabindex="-1"
        data-action="duplicate"
        ?compatibility="${compatibility}"
      >
        <arc-icon slot="item-icon" class="context-menu-icon" icon="contentCopy"></arc-icon>
        Duplicate
      </anypoint-icon-item>
    </anypoint-listbox>
  </anypoint-menu-button>
  `;
}
