import { VirtualApplication } from './virtual-application';
import { HandlerMapping } from './handler-mapping';
import { RoutingRule } from './routing-rule';
import { ConnectionStringInfo } from './connection-strings';
import { ApplicationSettingInfo } from './application-settings';
import { ProviderType } from '../../../site/deployment-center/Models/deployment-enums';

export interface ContainerSiteConfig {
  linuxFxVersion: string;
  windowsFxVersion: string;
  appCommandLine: string;
}

export interface SiteConfig extends ContainerSiteConfig {
  scmType: ProviderType;
  alwaysOn: boolean;
  cors: {
    allowedOrigins: string[];
  };
  apiDefinition: {
    url: string;
  };
  netFrameworkVersion: string;
  phpVersion: string;
  javaVersion: string;
  javaContainer: string;
  javaContainerVersion: string;
  pythonVersion: string;
  use32BitWorkerProcess: boolean;
  webSocketsEnabled: boolean;
  managedPipelineMode: string;
  remoteDebuggingEnabled: boolean;
  remoteDebuggingVersion: string;
  defaultDocuments: string[];
  handlerMappings: HandlerMapping[];
  virtualApplications: VirtualApplication[];
  autoSwapSlotName: string;
  routingRules?: RoutingRule[];
  experiments: {
    rampUpRules: RoutingRule[];
  };
  siteAuthEnabled: boolean;
  appSettings?: ApplicationSettingInfo[];
  connectionStrings?: ConnectionStringInfo[];
  ftpsState?: string;
  http20Enabled: boolean;
}
