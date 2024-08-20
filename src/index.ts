import {readFile, writeFile} from "fs-extra";
import md5 from "md5";
import {appendFile} from "node:fs/promises";

const HOSTS_FILE: string = "/etc/hosts";
const LAST_KNOWN_HASH_FILE: string = "/etc/hosts.md5";

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
    return `\n${urls.map(buildBlockingHostsLineFromUrl).join("\n")}`;
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

/*
    Fetches existing host file and computes the hash of this host file to check for changes, comparing against the last known hash of the file.
    If the file has changed, it appends a list of sites to block to the hosts file and stores a new hash to use for future comparisons.
 */
const blockSitesUsingHostFile = async () => {

    const hostsFile: string = await fetchHostsFile();
    const hostsFileHashMatches: boolean = await compareHostsFileHashToLastKnownHash(hostsFile);

    if(!hostsFileHashMatches) {
        console.log("Changes detected on hosts file.")
        await appendBlockedSitesToHostsFile();
        const updatedHostsFile = await fetchHostsLastKnownHashFile();
        await overwriteHostsLastKnownHashFile(updatedHostsFile);
    }

    console.log("No changes detected on hosts file.")
};


blockSitesUsingHostFile().then();