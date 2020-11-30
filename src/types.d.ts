import { ARCProject } from '@advanced-rest-client/arc-models';
import { AuthMeta } from '@advanced-rest-client/arc-types/src/request/ArcRequest';

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
