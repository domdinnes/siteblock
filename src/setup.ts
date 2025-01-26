

import {chmod, stat} from "node:fs/promises";
import {Permission, REQUIRED_PERMISSION} from "./utility/permission";
import {createFile} from "fs-extra";
import {enableLogging, getLogger} from "./utility/logger";
import {HOSTS_FILE_PATH, HOSTS_MD5_FILE_PATH} from "./utility/paths";

const requiredPermission = REQUIRED_PERMISSION;

if (process.getuid == null || process.getuid() != 0) {
    throw new Error('The initialization process needs to run as the super-user');
}

const initializeHosts = async () => {
    const hostFilePath = HOSTS_FILE_PATH;
    const actionTaken = await setRequiredPermission(hostFilePath, requiredPermission)
    logActionTaken(hostFilePath, actionTaken);
}

const initializeHostsMd5 = async () => {
    const hostMd5Path = HOSTS_MD5_FILE_PATH;
    try {
        await stat(hostMd5Path);
    }
    catch(err) {
        // File does not exist
        await createFile(hostMd5Path);
        Logger.log(`Successfully created: ${hostMd5Path}`)
    }

    const actionTaken = await setRequiredPermission(hostMd5Path, requiredPermission);
    logActionTaken(hostMd5Path, actionTaken);
}


const setRequiredPermission = async (filePath: string, requiredPermission: Permission) => {
    const stats = await stat(filePath);
    const permission = Permission.fromFileStats(stats);

    if(permission.matches(requiredPermission)) {
        return false;
    }
    const correctPermission = permission.overlay(requiredPermission);

    await chmod(filePath, correctPermission.toString());
    return true;
}

const logActionTaken = (filePath: string, actionTaken: boolean) => {
    if(actionTaken) {
        Logger.log(`Successfully updated permissions for: ${filePath}`)
    }
    else {
        Logger.log(`No action taken. ${filePath} already exists with correct permissions`)
    }
}


/*
 * Ensure that /etc/hosts is writable by all users.
 * Ensure that /etc/hosts.md5 exists and is writable by all users
 */
const initialize = async () => {
    Logger.log('Initialising host files.')
    await initializeHosts();
    await initializeHostsMd5();
    Logger.log('Initialisation Complete.')
}

enableLogging();
const Logger= getLogger("setup")
initialize().then(() => {});