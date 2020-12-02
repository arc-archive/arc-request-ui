import { css } from 'lit-element';

export default css`
:host {
  display: flex;
  position: relative;
  flex-direction: column;
}

[hidden] {
  display: none !important;
}

.workspace-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
}

arc-request-panel {
  flex: 1;
}

anypoint-tab {
  text-transform: none;
  font-size: 0.94rem;
}

anypoint-tab arc-icon {
  width: 12px;
  height: 12px;
}

.add-request-button {
  width: 40px;
  height: 40px;
}

.tab-name {
  display: block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
}
`;
