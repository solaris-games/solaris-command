import { Station, BuildStationResponseSchema } from "@solaris-command/core";

export class StationMapper {
  static toBuildStationResponse(
    station: Station,
    prestigeCost: number
  ): BuildStationResponseSchema {
    return {
      station, // Safe to use full model
      prestigeCost,
    };
  }
}
