import { ARCProject } from '@advanced-rest-client/arc-models';
import { ArcEditorRequest, AuthMeta } from '@advanced-rest-client/arc-types/src/request/ArcRequest';

export declare interface ARCProjectNames extends ARCProject {
  missing: boolean;
}

export declare interface AuthorizationTemplateOptions {
  outlined?: boolean;
  compatibility?: boolean;
  ui?: AuthMeta;
  oauth2RedirectUri: string;
  hidden?: boolean;
}

/**
 * An object that describes a workspace tab 
 */
export declare interface WorkspaceTab {
  /**
   * The internal for the workspace id of the request panel.
   * This has nothing to do with the request id or editor request id. It just keeps track which tabs controls which request panel
   * as both requests and tabs array are out of sync by design.
   * 
   * The id is generated when a tab is being created.
   */
  id: string;
  /**
   * A label to render on the tab.
   */
  label: string;
}

export declare interface WorkspaceRequest extends ArcEditorRequest {
  /**
   * The ID of the tab
   */
  tab: string;
}

export declare interface AddRequestOptions {
  /**
   * Won't check for empty panel before appending it to the list
   */
  skipPositionCheck?: boolean;
  /**
   * Won't attempt to select added request
   */
  noAutoSelect?: boolean;
  /**
   * When set it will not call the `requestUpdate()`
   */
  skipUpdate?: boolean;
  /**
   * When set it ignores call to store workspace data in the store.
   */
  skipStore?: boolean;
}
