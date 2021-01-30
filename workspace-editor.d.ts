import { WorkspaceEditorElement } from './src/WorkspaceEditorElement';

declare global {
  interface HTMLElementTagNameMap {
    "workspace-editor": WorkspaceEditorElement;
  }
}
