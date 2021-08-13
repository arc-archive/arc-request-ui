import { fixture, assert, html, nextFrame } from '@open-wc/testing';
import { ArcMock } from '@advanced-rest-client/arc-data-generator';
// import { ArcModelEvents, ArcModelEventTypes, TransportEvents } from '@advanced-rest-client/arc-events';
import { loadMonaco } from './MonacoSetup.js';
import { tabsValue, requestsValue } from '../src/ArcRequestWorkspaceElement.js';
import '../arc-request-workspace.js';

/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.WorkspaceRequestUnion} WorkspaceRequestUnion */
/** @typedef {import('../index').ArcRequestWorkspaceElement} ArcRequestWorkspaceElement */

describe('ArcRequestWorkspaceElement', () => {
  const gen = new ArcMock();

  /**
   * @returns {Promise<ArcRequestWorkspaceElement>}
   */
  async function basicFixture() {
    return fixture(html`
      <arc-request-workspace></arc-request-workspace>
    `);
  }

  before(async () => loadMonaco());

  describe('closing panels from a tab click', () => {
    /** @type ArcRequestWorkspaceElement */
    let element;

    beforeEach(async () => { 
      element = await basicFixture();
      const requests = gen.http.listHistory(2);
      const workspace = /** @type DomainWorkspace */ ({
        kind: 'ARC#DomainWorkspace',
        id: '1234',
        requests,
      });
      element.setWorkspace(workspace);
      await nextFrame();
    });

    it('closes a panel', async () => {
      const lengthBefore = element[requestsValue].length;
      const tab = /** @type HTMLElement */ (element.shadowRoot.querySelector('workspace-tab'));
      tab.dispatchEvent(new Event('close'));
      const lengthAfter = element[requestsValue].length;
      assert.notEqual(lengthAfter, lengthBefore);
    });

    it('closes a tab', async () => {
      const lengthBefore = element[tabsValue].length;
      const tab = /** @type HTMLElement */ (element.shadowRoot.querySelector('workspace-tab'));
      tab.dispatchEvent(new Event('close'));
      const lengthAfter = element[tabsValue].length;
      assert.notEqual(lengthAfter, lengthBefore);
    });

    it('closes the panel that corresponds to the tab', async () => {
      const { id } = element[requestsValue][0];
      const tab = /** @type HTMLElement */ (element.shadowRoot.querySelector('workspace-tab'));
      tab.dispatchEvent(new Event('close'));
      assert.notEqual(element[requestsValue][0].id, id);
    });

    it('closes the tab', async () => {
      const { id } = element[tabsValue][0];
      const tab = /** @type HTMLElement */ (element.shadowRoot.querySelector('workspace-tab'));
      tab.dispatchEvent(new Event('close'));
      assert.notEqual(element[tabsValue][0].id, id);
    });
  });
});
