import { IAirdropLoot } from "@spt/models/spt/config/IAirdropConfig";

interface Toggle {
    airDropTimingEnabled: boolean;
    airDropTypeWeightingEnabled: boolean;
    airDropPercentChanceByLocationEnabled: boolean;
    airDropLootConfigEnabled: boolean;
    replaceLists: boolean;
}

interface Config {
    debugLogsEnabled: boolean;
    toggle: Toggle;
    airdropTiming: Record<string, number>;
    airdropTypeWeighting: Record<string, number>;
    airdropPercentChanceByLocation: Record<string, number>;
    airdropLootConfig: Record<string, IAirdropLoot>;
}

export default Config;