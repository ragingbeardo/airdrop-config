# Tarkov Airdrop Configuration Mod

This mod allows you to customize the configuration of airdrops in Escape from Tarkov using the `config.json5` file. You can adjust various parameters such as the timing, type weightings, and loot content of airdrops.

## Installation

1. Download the zip file and extract it.
2. Copy the `user` folder into your SPT directory.
3. Ensure the `config.json5` file is located in the `config` folder of `ragingbeardo-airdropconfig` in your `user/mods` directory.

## Configuration

### Debug

`debugLogsEnabled`: true/false (default false)

### Toggle

- `airDropTimingEnabled`: true/false (default false),
- `airDropTypeWeightingEnabled`: true/false (default false),
- `airDropPercentChanceByLocationEnabled`: true/false (default false),
- `airDropLootConfigEnabled`: true/false (default false)

### Airdrop Timing

- `planeAirdropStartMin`: Minimum time (in seconds) before the airdrop plane appears.
- `planeAirdropStartMax`: Maximum time (in seconds) before the airdrop plane appears.

### Airdrop Type Weighting

Go with heart on this one. Bigger Number = Bigger Odds. Or just leave it be. I'm not your supervisor.

- `mixed`: number
- `weaponArmor`: number
- `foodMedical`: number
- `barter`: number

### Airdrop Percent Chance by Location

Set the chance (out of 100) for an airdrop to occur at each location:

- `customs`: number
- `interchange`: number
- `woods`: number
- `shoreline`: number
- `reserve`: number
- `groundzero`: number (no drops on low level ground zero)
- `streets`: number
- `lighthouse`: number

### Airdrop Loot Configuration

Loot config split by airdrop types:
- `mixed`
- `weaponArmor`
- `foodMedical`
- `barter`

Each loot configuration can include the following parameters:

- `weaponPresetCount`: number range of weapons that can be in the drop
- `armorPresetCount`: number range of armors(helmets/vests) that can appear in the drop
- `itemCount`: general item amount showing up
- `weaponCrateCount`: number range of weapon crates that can be in the drop
- `itemBlacklist`: an ID list of things you don't want showing up
- `itemTypeWhiteList`: if this list is empty, you will only get items from the weapon, armor, and crate count items
- `itemLimits`: a numerical limit for a specific ID
- `itemStackLimits`: a numerical range for a specific ID
- `armorWhiteList`: armorLevelWhitelist: what level of armor can show up (as far as i could tell i think 0 is the same as nothing) [0,1,2,3,4,5,6]
- `allowBossItems`: I think you can understand this one on your own (haven't tested yet, might still needs id whitelisting to actually show up but can't say for sure)