import { useQuery } from '@tanstack/react-query';
import { listProjects } from './api';

export const projectKeys = {
    all: ['projects'] as const,
    list: () => [...projectKeys.all, 'list'] as const,
};

/** The live repositories, asked for only while `enabled` (the API is online, PF-007 D4), with the default retry policy. */
export function useProjects(enabled: boolean) {
    return useQuery({
        queryKey: projectKeys.list(),
        queryFn: ({ signal }) => listProjects(signal),
        enabled,
    });
}
