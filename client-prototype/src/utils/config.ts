import {FrontendConfig} from "../../../core";
import {InjectionKey} from "vue";

export const configInjectionKey: InjectionKey<FrontendConfig> = Symbol('config');
