import { Unit, DeployUnitResponseSchema } from "@solaris-command/core";

export class UnitMapper {
  static toDeployUnitResponse(unit: Unit): DeployUnitResponseSchema {
    return {
      unit, // Safe to use full model
    };
  }
}
