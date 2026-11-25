/** The deployed version, which the deploy job sets from `git describe` (PF-027 P16); undefined in development and tests. */
export function appVersion(): string | undefined {
    const version = import.meta.env.VITE_APP_VERSION;
    return version === '' ? undefined : version;
}

const releaseTag = /^v\d+\.\d+\.\d+$/;
const describedCommit = /^(v\d+\.\d+\.\d+)-\d+-g([0-9a-f]{7,40})$/;
const bareCommit = /^[0-9a-f]{7,40}$/;

/**
 * Where a version's changes are on GitHub: a release tag (`v1.0.0`) links to its release notes, a `git describe` value
 * (`v1.0.0-3-gabc1234`) to the changes since that release, and a bare commit to the commit. Anything else has no link.
 */
export function versionLink(version: string, repositoryUrl: string): string | null {
    if (releaseTag.test(version)) {
        return `${repositoryUrl}/releases/tag/${version}`;
    }
    const [, tag, commit] = describedCommit.exec(version) ?? [];
    if (tag && commit) {
        return `${repositoryUrl}/compare/${tag}...${commit}`;
    }
    return bareCommit.test(version) ? `${repositoryUrl}/commit/${version}` : null;
}
