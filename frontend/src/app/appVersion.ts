/** The site's version, such as `v1.0.0`: `v` plus `version` in frontend/package.json, set at build time (PF-027 P16). */
export function appVersion(): string {
    return __APP_VERSION__;
}

const releaseTag = /^v\d+\.\d+\.\d+$/;

/** The GitHub Release notes of a version such as `v1.0.0`, or null for anything that is not a release number. */
export function versionLink(version: string, repositoryUrl: string): string | null {
    return releaseTag.test(version) ? `${repositoryUrl}/releases/tag/${version}` : null;
}
