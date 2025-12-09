import {
  Station,
  BuildStationResponse,
} from "@solaris-command/core";

export class StationMapper {
  static toBuildStationResponse(
    station: Station,
    prestigeCost: number
  ): BuildStationResponse {
    return {
      station,
      prestigeCost,
    };
  }
}
