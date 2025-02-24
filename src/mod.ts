/* eslint-disable @typescript-eslint/brace-style */
import path from "node:path";
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { IAirdropConfig } from "@spt/models/spt/config/IAirdropConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { VFS } from "@spt/utils/VFS";
import { SptAirdropTypeEnum } from "@spt/models/enums/AirdropType";

import JSON5 from "json5";
import config from "./model/config";

class Mod implements IPostDBLoadMod {
    private modConfig: config;

    public postDBLoad(container: DependencyContainer): void {
        const vfs = container.resolve<VFS>("VFS");
        this.modConfig = JSON5.parse(vfs.readFile(path.resolve(__dirname, "../config/config.json5")));

        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const airdropConfig = configServer.getConfig<IAirdropConfig>(ConfigTypes.AIRDROP);
        const tables: IDatabaseTables = databaseServer.getTables();
        const locations = tables.locations;

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

        for (const type in SptAirdropTypeEnum) {
            if (SptAirdropTypeEnum[type] !== SptAirdropTypeEnum.RADAR) {
                airdropConfig.airdropTypeWeightings[SptAirdropTypeEnum[type]] = this.modConfig.airdropTypeWeighting[SptAirdropTypeEnum[type]];
                airdropConfig.loot[SptAirdropTypeEnum[type]] = this.modConfig.airdropLootConfig[SptAirdropTypeEnum[type]];
            }
        }

        for (const configLocation in locationMapping) {
            const mappedLocations = locationMapping[configLocation];
            const locationsArray = Array.isArray(mappedLocations) ? mappedLocations : [mappedLocations];

            for (const location of locationsArray) {
                if (!ignoredLocations.includes(location)) {
                    locations[location].base.AirdropParameters[0].PlaneAirdropChance = parseFloat((this.modConfig.airdropPercentChanceByLocation[configLocation] / 100).toFixed(2));
                    locations[location].base.AirdropParameters[0].PlaneAirdropStartMin = this.modConfig.airdropTiming["planeAirdropStartMin"];
                    locations[location].base.AirdropParameters[0].PlaneAirdropStartMax = this.modConfig.airdropTiming["planeAirdropStartMax"];
                }
            }
        }
    }
}

export const mod = new Mod();
