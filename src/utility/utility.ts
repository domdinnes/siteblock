import {exec} from "node:child_process";

export const execute = async (command: string, options: Object): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            exec(
                command,
                options,
                (err, stdout, stderr) => {
                    if (err == null) {
                        resolve(stdout.toString());
                    } else {
                        reject(stderr.toString());
                    }
                }
            )
        } catch (error) {
            reject(error)
        }
    });
}