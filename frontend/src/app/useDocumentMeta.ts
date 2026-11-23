import { useEffect } from 'react';

export interface DocumentMeta {
    title: string;
    description: string;
}

/**
 * Sets the document title and the meta description for the current route (PF-003 P3). It writes to the tags
 * `index.html` already has, and adds the description tag when it is missing, rather than rendering React 19's hoisted
 * `<title>`, which would duplicate the static default that link previews still read (D7).
 */
export function useDocumentMeta({ title, description }: DocumentMeta): void {
    useEffect(() => {
        document.title = title;
        let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.append(meta);
        }
        meta.content = description;
    }, [title, description]);
}
