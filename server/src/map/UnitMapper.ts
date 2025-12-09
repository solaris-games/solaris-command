import { Unit, DeployUnitResponse } from "@solaris-command/core";

export class UnitMapper {
  static toDeployUnitResponse(unit: Unit): DeployUnitResponse {
    return {
      unit,
    };
  }
}
