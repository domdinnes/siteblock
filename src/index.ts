import {readFile, writeFile} from "fs-extra";
import md5 from "md5";
import {appendFile, stat} from "node:fs/promises";
import {enableLogging, getLogger} from "./utility/logger";
import {HOSTS_FILE_PATH, HOSTS_MD5_FILE_PATH} from "./utility/paths";
import {Permission, REQUIRED_PERMISSION} from "./utility/permission";

const HOSTS_FILE: string = HOSTS_FILE_PATH;
const LAST_KNOWN_HASH_FILE: string = HOSTS_MD5_FILE_PATH;

const blockedSites: string[] = [
    "reddit.com",
    "old.reddit.com",
    "www.reddit.com",
    "https://www.reddit.com",
    "news.ycombinator.com",
    "youtube.com",
    "www.youtube.com",
    "news.google.com"
]

const buildBlockingHostsLineFromUrl = (url: string) => {
    return `127.0.0.1       ${url}`;
}

const buildHostsSnippetToAppend = (urls: string[]) => {
    return `\n# Blocked websites added by siteblock (https://github.com/domdinnes/siteblock)\n${urls.map(buildBlockingHostsLineFromUrl).join("\n")}\n`;
}


const appendBlockedSitesToHostsFile = async () => {
    const blockSnippet = buildHostsSnippetToAppend(blockedSites);
    await appendFile(HOSTS_FILE, blockSnippet);
}

const fetchHostsFile = async () => {
    const file = await readFile(HOSTS_FILE);
    return file.toString("utf-8");
};

/*
    Attempts to fetch the hosts hash file. If does not exist returns an empty string.
 */
const fetchHostsLastKnownHashFile = async () => {
    try {
        const file = await readFile(LAST_KNOWN_HASH_FILE);
        return file.toString("utf-8");
    }
    catch (err: any) {
        if(err.code === 'ENOENT') {
            return "";
        }
        throw err;
    }
}

const compareHostsFileHashToLastKnownHash = async (hostsFile: string) => {
    const currentHash = md5(hostsFile);

    const lastKnownHash: string = await fetchHostsLastKnownHashFile();

    return currentHash === lastKnownHash;
}


const overwriteHostsLastKnownHashFile = async (hostsFile: string) => {
    const replacementHash = md5(hostsFile);
    await writeFile(LAST_KNOWN_HASH_FILE, Buffer.from(replacementHash, "utf-8"));
}

const checkFilesAndPermissionsExist = async () => {
    let filesAndPermissionsExist: boolean;

    try {
        const hostsFileStats = await stat(HOSTS_FILE);
        const hostsFilePermission = Permission.fromFileStats(hostsFileStats);

        const hostMd5FileStats = await stat(HOSTS_MD5_FILE_PATH);
        const hostMd5FilePermission = Permission.fromFileStats(hostMd5FileStats);

        filesAndPermissionsExist = (
            hostsFilePermission.matches(REQUIRED_PERMISSION)
            && hostMd5FilePermission.matches(REQUIRED_PERMISSION)
        )
    }
    catch (err) {
        filesAndPermissionsExist = false;
    }

    return filesAndPermissionsExist;
}

/*
    Fetches existing host file and computes the hash of this host file to check for changes, comparing against the last known hash of the file.
    If the file has changed, it appends a list of sites to block to the hosts file and stores a new hash to use for future comparisons.
 */
const blockSitesUsingHostFile = async () => {
    Logger.log('Checking for changes to hosts file.')

    const hostsFile: string = await fetchHostsFile();
    const hostsFileHashMatches: boolean = await compareHostsFileHashToLastKnownHash(hostsFile);

    if(!hostsFileHashMatches) {
        Logger.log("Changes detected to hosts file. Appending list of blocked sites.")
        await appendBlockedSitesToHostsFile();
        const updatedHostsFile = await fetchHostsFile();
        await overwriteHostsLastKnownHashFile(updatedHostsFile);
    }
    else {
        Logger.log("No changes detected to hosts file. No further action taken.")
    }

    Logger.log("Finished processing hosts file.")
};

const main = async () => {
    // File permissions exist
    const filesAndPermissionsExist = await checkFilesAndPermissionsExist();

    if(!filesAndPermissionsExist) {
        Logger.log("Necessary files and permissions don't exist. Please run the following command: `npm run setup`")
        return;
    }

    await blockSitesUsingHostFile();
    // Block sites
};

enableLogging();
const Logger= getLogger("default")
main().then(() => {});