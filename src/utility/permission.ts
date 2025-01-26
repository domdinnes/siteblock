import {Stats} from "node:fs";


type Octal  = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Wildcard = "*";
type PermissionCharacter = Octal | Wildcard
export type PermissionLiteral = `${PermissionCharacter}${PermissionCharacter}${PermissionCharacter}`;

export class Permission {

    private constructor(
        private readonly _0: PermissionCharacter,
        private readonly _1: PermissionCharacter,
        private readonly _2: PermissionCharacter,
    ) {}

    public static parse(permission: string): Permission {
        if(!isPermission(permission)) {
            throw new Error(`Illegal argument ${permission}`);
        }
        return Permission.fromLiteral(permission);
    }

    public static fromLiteral(permission: PermissionLiteral) {
        return new Permission(
            permission[0] as PermissionCharacter,
            permission[1] as PermissionCharacter,
            permission[2] as PermissionCharacter
        );
    }

    public static fromFileStats(stats: Stats) {
        const filePermission = stats.mode & parseInt("777", 8);
        const _0 = filePermission >> 6;
        const _1 = (filePermission >> 3) & 7;
        const _2 = filePermission & 7;
        return Permission.parse(`${_0}${_1}${_2}`);
    }

    public matches(permission: Permission): boolean {
        return this.charsMatch(this._0, permission._0)
        && this.charsMatch(this._1, permission._1)
        && this.charsMatch(this._2, permission._2)
    }

    public overlay(permission: Permission): Permission {
        return new Permission(
            this.overlayChar(this._0, permission._0),
            this.overlayChar(this._1, permission._1),
            this.overlayChar(this._2, permission._2)
        )
    }

    public toString() {
        // Should throw if wildcard character exists
        return `${this._0}${this._1}${this._2}`
    }

    private charsMatch(char1: PermissionCharacter, char2: PermissionCharacter): boolean {
        return (char1 == "*" || char2 == "*") || (char1 == char2);
    }


    private overlayChar(
        target: PermissionCharacter,
        overlay: PermissionCharacter
    ): PermissionCharacter{
        return overlay == "*" ? target : overlay;
    }

}

export const REQUIRED_PERMISSION = Permission.fromLiteral("**6");


function isPermission(permission: string): permission is PermissionLiteral {
    if(permission.length != 3) {
        return false;
    }

    const passingChars = permission.split("").filter(char => {
        if(char == "*") {
            return true;
        }

        if(isNaN(parseInt(char))) {
            return false
        }

        return parseInt(char) < 8
    });

    return passingChars.length == 3;
}