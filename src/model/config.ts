import { IAirdropLoot } from "@spt/models/spt/config/IAirdropConfig";

interface Config {
    airdropTimings: Record<string, number>;
    airdropTypeWeighting: Record<string, number>;
    airdropPercentChanceByLocation: Record<string, number>;
    airdropLootConfig: Record<string, IAirdropLoot>;
}

export default Config;