import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class LoggingUtil {
    private logger: ILogger;
    private debugMode: boolean;

    constructor(logger: ILogger, debugMode: boolean)
    {
        this.logger = logger;
        this.debugMode = debugMode;
    }

    public green(message: string) : void
    {
        this.logger.log(`[Airdrop Config Options]: ${message}`, LogTextColor.GREEN);
    }

    public yellow(message: string) : void
    {
        this.logger.log(`[Airdrop Config Options]: ${message}`, LogTextColor.YELLOW);
    }

    public red(message: string) : void
    {
        this.logger.log(`[Airdrop Config Options]: ${message}`, LogTextColor.RED);
    }

    public error(message: string) : void
    {
        this.logger.error(`[Airdrop Config Options]: ${message}`);
    }

    public debugYellow(message: string) : void
    {
        this.logger.log(`[Airdrop Config Options]: ${message}`, LogTextColor.YELLOW);
    }

    public debugRed(message: string) : void
    {
        this.logger.log(`[Airdrop Config Options]: ${message}`, LogTextColor.RED);
    }
}