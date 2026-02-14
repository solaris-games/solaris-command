import { FrontendConfig } from "@solaris-command/core/src/types/config";
import { InjectionKey } from "vue";

export const configInjectionKey: InjectionKey<FrontendConfig> =
  Symbol("config");
