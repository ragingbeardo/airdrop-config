/* eslint-disable @typescript-eslint/brace-style */
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { IAirdropConfig, IAirdropLoot } from "@spt/models/spt/config/IAirdropConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { VFS } from "@spt/utils/VFS";
import { SptAirdropTypeEnum } from "@spt/models/enums/AirdropType";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

import JSON5 from "json5";
import config from "./model/config";

class Mod implements IPostDBLoadMod {
    private modConfig: config;

    public postDBLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const vfs = container.resolve<VFS>("VFS");
        this.modConfig = JSON5.parse(vfs.readFile(path.resolve(__dirname, "../config/config.json5")));

        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const airdropConfig = configServer.getConfig<IAirdropConfig>(ConfigTypes.AIRDROP);
        const tables: IDatabaseTables = databaseServer.getTables();
        const locations = tables.locations;

        const defaultAirdropIcons = {
            mixed: "Common",
            barter: "Supply",
            foodMedical: "Medical",
            weaponArmor: "Weapon"
        };

        const ignoredLocations = [
            "develop",
            "factory4_day",
            "factory4_night",
            "hideout",
            "laboratory",
            "privatearea",
            "suburbs",
            "terminal",
            "town",
            "base"
        ];

        const locationMapping = {
            customs: "bigmap",
            interchange: "interchange",
            woods: "woods",
            shoreline: "shoreline",
            reserve: "rezervbase",
            groundzero: ["sandbox", "sandbox_high"],
            streets: "tarkovstreets",
            lighthouse: "lighthouse"
        };

        const lootConfigListsToAmend = [
            "itemBlacklist",
            "itemTypeWhitelist",
            "itemLimits",
            "itemStackLimits",
            "armorLevelWhitelist"
        ];

        const combineListsFunctions = {
            itemBlacklist: combineBasicList,
            itemTypeWhitelist: combineBasicList,
            itemLimits: combineBasicKVPairs,
            itemStackLimits: combineBasicKVPairs,
            armorLevelWhitelist: combineBasicList
        };

        function combineBasicList(baseList: any[], modList: any[]): any[] {
            const combinedList = new Set(baseList);
            for (const item of modList) {
                combinedList.add(item);
            }
            const resultList = Array.from(combinedList);
            if (resultList.every(item => typeof item === "number")) {
                resultList.sort((a, b) => a - b);
            }
            return resultList;
        }

        function combineBasicKVPairs(baseObj: Record<string, any>, modObj: Record<string, any>): Record<string, any> {
            const combinedObj = { ...baseObj };
            for (const key in modObj) {
                combinedObj[key] = modObj[key];
            }
            return combinedObj;
        }

        function mergeLootConfiguration(baseLootConfigForType: IAirdropLoot, modLootConfigForType: IAirdropLoot) {
            for (const field in modLootConfigForType) {
                if (field !== "icon") {
                    if (lootConfigListsToAmend.includes(field)) {
                        let baseLootConfig: IAirdropLoot = baseLootConfigForType[field];
                        const modLootConfig: IAirdropLoot = modLootConfigForType[field];
                        baseLootConfig = combineListsFunctions[field](baseLootConfig, modLootConfig);
                    } else {
                        baseLootConfigForType[field] = modLootConfigForType[field];
                    }
                }
            }
        }

        if (this.modConfig.toggle.airDropTypeWeightingEnabled || this.modConfig.toggle.airDropLootConfigEnabled) {
            for (const type in SptAirdropTypeEnum) {
                if (SptAirdropTypeEnum[type] !== SptAirdropTypeEnum.RADAR) {
                    if (this.modConfig.toggle.airDropTypeWeightingEnabled) {
                        airdropConfig.airdropTypeWeightings[SptAirdropTypeEnum[type]] = this.modConfig.airdropTypeWeighting[SptAirdropTypeEnum[type]];
                        if (this.modConfig.debugLogsEnabled) {
                            logger.logWithColor(`airdropconfig: Setting airdrop type weight for ${SptAirdropTypeEnum[type]} to ${this.modConfig.airdropTypeWeighting[SptAirdropTypeEnum[type]]}`, LogTextColor.YELLOW);
                        }
                    }

                    if (this.modConfig.toggle.airDropLootConfigEnabled) {
                        if (this.modConfig.toggle.replaceLists) {
                            this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]].icon = defaultAirdropIcons[SptAirdropTypeEnum[type]];
                            airdropConfig.loot[SptAirdropTypeEnum[type]] = this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]];
                        } else {
                            logger.logWithColor(`airdropconfig: Merging loot configuration for ${SptAirdropTypeEnum[type]}`, LogTextColor.YELLOW);
                            mergeLootConfiguration(airdropConfig.loot[SptAirdropTypeEnum[type]], this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]]);
                        }
                    }
                }
            }
        }

        if (this.modConfig.toggle.airDropPercentChanceByLocationEnabled || this.modConfig.toggle.airDropTimingEnabled) {
            for (const configLocation in locationMapping) {
                const mappedLocations = locationMapping[configLocation];
                const locationsArray = Array.isArray(mappedLocations) ? mappedLocations : [mappedLocations];

                for (const location of locationsArray) {
                    if (!ignoredLocations.includes(location)) {
                        if (this.modConfig.toggle.airDropPercentChanceByLocationEnabled) {
                            locations[location].base.AirdropParameters[0].PlaneAirdropChance = parseFloat((this.modConfig.airdropPercentChanceByLocation[configLocation] / 100).toFixed(2));
                            if (this.modConfig.debugLogsEnabled) {
                                logger.logWithColor(`airdropconfig: Setting airdrop chance for ${location} to ${this.modConfig.airdropPercentChanceByLocation[configLocation]}%`, LogTextColor.YELLOW);
                            }
                        }

                        if (this.modConfig.toggle.airDropTimingEnabled) {
                            locations[location].base.AirdropParameters[0].PlaneAirdropStartMin = this.modConfig.airdropTiming["planeAirdropStartMin"];
                            if (this.modConfig.debugLogsEnabled) {
                                logger.logWithColor(`airdropconfig: Setting airdrop start min for ${location} to ${this.modConfig.airdropTiming["planeAirdropStartMin"]}`, LogTextColor.YELLOW);
                            }
                            locations[location].base.AirdropParameters[0].PlaneAirdropStartMax = this.modConfig.airdropTiming["planeAirdropStartMax"];
                            if (this.modConfig.debugLogsEnabled) {
                                logger.logWithColor(`airdropconfig: Setting airdrop start max for ${location} to ${this.modConfig.airdropTiming["planeAirdropStartMax"]}`, LogTextColor.YELLOW);
                            }
                        }
                    }
                }
            }
        }
    }
}

export const mod = new Mod();
