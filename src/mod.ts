/* eslint-disable @typescript-eslint/brace-style */
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { IAirdropConfig, IAirdropLoot } from "@spt/models/spt/config/IAirdropConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { SptAirdropTypeEnum } from "@spt/models/enums/AirdropType";
import { VFS } from "@spt/utils/VFS";
import { ILogger } from "@spt/models/spt/utils/ILogger";

import config from "./model/config";
import { LoggingUtil } from "./util/logging";

import { jsonc } from "jsonc";

class Mod implements IPostDBLoadMod {
    private loggingUtil: LoggingUtil;
    private modConfig: config;

    public postDBLoad(container: DependencyContainer): void {
        const vfs = container.resolve<VFS>("VFS");
        this.modConfig = jsonc.parse(vfs.readFile(path.resolve(__dirname, "../config/config.jsonc")));
        this.loggingUtil = new LoggingUtil(container.resolve<ILogger>("WinstonLogger"), this.modConfig.debugLogsEnabled);

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

        const validateFunctions = {
            itemBlacklist: validateStringArray,
            itemTypeWhitelist: validateStringArray,
            itemLimits: validateObject,
            itemStackLimits: validateObject,
            armorLevelWhitelist: validateNumberArray
        };

        function validateStringArray(list: any[]): boolean {
            return list.every(item => typeof item === "string");
        }

        function validateNumberArray(list: any[]): boolean {
            return list.every(item => typeof item === "number");
        }

        function validateObject(obj: Record<string, any>): boolean {
            return typeof obj === "object" && obj !== null && !Array.isArray(obj);
        }

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
                        const baseLootConfig = baseLootConfigForType[field];
                        const modLootConfig = modLootConfigForType[field];
                        if (validateFunctions[field](modLootConfig)) {
                            baseLootConfigForType[field] = combineListsFunctions[field](baseLootConfig, modLootConfig);
                        } else {
                            this.loggingUtil.red(`Invalid type for field ${field}`)
                        }
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
                            this.loggingUtil.yellow(`Setting airdrop type weight for ${SptAirdropTypeEnum[type]} to ${this.modConfig.airdropTypeWeighting[SptAirdropTypeEnum[type]]}`)
                        }
                    }

                    if (this.modConfig.toggle.airDropLootConfigEnabled) {
                        if (this.modConfig.toggle.replaceLists) {
                            this.loggingUtil.debugYellow(`Replacing loot configuration for ${SptAirdropTypeEnum[type]}`)
                            this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]].icon = defaultAirdropIcons[SptAirdropTypeEnum[type]];
                            airdropConfig.loot[SptAirdropTypeEnum[type]] = this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]];
                        } else {
                            this.loggingUtil.debugYellow(`Merging loot configuration for ${SptAirdropTypeEnum[type]}`)
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
                                this.loggingUtil.debugYellow(`airdropconfig: Setting airdrop chance for ${location} to ${this.modConfig.airdropPercentChanceByLocation[configLocation]}%`)
                            }
                        }

                        if (this.modConfig.toggle.airDropTimingEnabled) {
                            locations[location].base.AirdropParameters[0].PlaneAirdropStartMin = this.modConfig.airdropTiming["planeAirdropStartMin"];
                            if (this.modConfig.debugLogsEnabled) {
                                this.loggingUtil.debugYellow(`airdropconfig: Setting airdrop start min for ${location} to ${this.modConfig.airdropTiming["planeAirdropStartMin"]}`)
                            }
                            locations[location].base.AirdropParameters[0].PlaneAirdropStartMax = this.modConfig.airdropTiming["planeAirdropStartMax"];
                            if (this.modConfig.debugLogsEnabled) {
                                this.loggingUtil.debugYellow(`Setting airdrop start max for ${location} to ${this.modConfig.airdropTiming["planeAirdropStartMax"]}`)
                            }
                        }
                    }
                }
            }
        }
    }
}

export const mod = new Mod();
