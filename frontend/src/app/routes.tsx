import type { RouteObject } from 'react-router';
import { CaseStudyPage } from '../pages/CaseStudyPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { RootLayout } from './RootLayout';

/** The pages that can render inside the layout. An unknown `/work/` slug renders the 404 page from `CaseStudyPage`. */
export const pageRoutes: RouteObject[] = [
    { index: true, element: <HomePage /> },
    { path: 'work/:slug', element: <CaseStudyPage /> },
    { path: '*', element: <NotFoundPage /> },
];

/** Builds the route tree. A page that throws while rendering is replaced by `RouteErrorPage`, and the layout stays. */
export function buildRoutes(pages: RouteObject[]): RouteObject[] {
    return [{ element: <RootLayout />, children: [{ errorElement: <RouteErrorPage />, children: pages }] }];
}

export const routes = buildRoutes(pageRoutes);
