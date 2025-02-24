# Tarkov Airdrop Configuration Mod

This mod allows you to customize the configuration of airdrops in Escape from Tarkov using the `config.json5` file. You can adjust various parameters such as the timing, type weightings, and loot content of airdrops.

## Installation

1. Download the zip file and extract it.
2. Copy the `user` folder into your SPT directory.
3. Ensure the `config.json5` file is located in the `config` folder of `ragingbeardo-airdropconfig` in your `user/mods` directory.

## Configuration

### Airdrop Timing

- `planeAirdropStartMin`: Minimum time (in seconds) before the airdrop plane appears.
- `planeAirdropStartMax`: Maximum time (in seconds) before the airdrop plane appears.

### Airdrop Type Weighting

I'm gonna keep it 100 and say I can't tell you how exactly the weightings work, but the default ratings are the same as base SPTarkov settings.

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
- `groundzero`: number
- `streets`: number
- `lighthouse`: number

### Airdrop Loot Configuration

This setting has a large amount of configuration to do. The default state is the same as base SPTarkov. Some fields like armorWHitelist are still unknown as to how it actually works to me. 

Airdrop Types:
- `mixed`
- `weaponArmor`
- `foodMedical`
- `barter`

Each loot configuration can include the following parameters:

- `icon`: NO TOUCHY, this exists to match default config but you shouldn't need to change this
- `weaponPresetCount`: number range
- `armorPresetCount`: number range
- `itemCount`: number range
- `weaponCrateCount`: number range
- `itemBlacklist`: blacklist using id
- `itemTypeWhiteList`: whitelist using id
- `itemLimits`: set limit based on item id
- `itemStackLimits`: set limit based on item id
- `armorWhiteList`: still trying to figure out the explanation for this one
- `allowBossItems`: true/false