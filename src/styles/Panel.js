import { css } from 'lit-element';

export default css`
:host {
  display: block;
  position: relative;
}

:host(.stacked) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:host(.stacked) .panel {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-progress {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  width: auto;
}

.bottom-sheet-container  {
  width: var(--bottom-sheet-width, 100%);
  max-width: var(--bottom-sheet-max-width, 700px);
  right: var(--cookie-manager-bottom-sheet-right, 40px);
  left: var(--cookie-manager-bottom-sheet-left, auto);
}
`;
