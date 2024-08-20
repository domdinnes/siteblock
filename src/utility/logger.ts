import debug from "debug";


export type Logger = {
  log: debug.Debugger  
};

export type LoggerType = "default" | "unit-test" | "integration-test";


export const getLogger = (loggerName: string, loggerType?: LoggerType): Logger => {

    const namespace= getNamespace(loggerType);

    return {
        log:  debug(`${namespace}:${loggerName}`)
    };
}

export const enableLogging = (loggerType?: LoggerType) => {
    const namespace= getNamespace(loggerType);

    debug.enable(`${namespace}:*`);
}


const getNamespace = (loggerType?: LoggerType) => {
    return loggerType == undefined || loggerType == "default" ? "whisper-node" : loggerType;
}
