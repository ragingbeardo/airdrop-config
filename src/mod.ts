/* eslint-disable @typescript-eslint/brace-style */
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { IAirdropConfig } from "@spt/models/spt/config/IAirdropConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { VFS } from "@spt/utils/VFS";
import { SptAirdropTypeEnum } from "@spt/models/enums/AirdropType";

import JSON5 from "json5";
import config from "./model/config";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";

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
                        if (defaultAirdropIcons[SptAirdropTypeEnum[type]] == this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]].icon) {
                            airdropConfig.loot[SptAirdropTypeEnum[type]] = this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]];
                        } else {
                            logger.logWithColor(`Loot settings not applied for ${SptAirdropTypeEnum[type]}. Ensure icon value is ${defaultAirdropIcons[SptAirdropTypeEnum[type]]}`, LogTextColor.RED);
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
