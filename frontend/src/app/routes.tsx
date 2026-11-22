import type { RouteObject } from 'react-router';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { RootLayout } from './RootLayout';

/** The pages that can render inside the layout; PF-003 adds `/work/:slug`. */
export const pageRoutes: RouteObject[] = [
    { index: true, element: <HomePage /> },
    { path: '*', element: <NotFoundPage /> },
];

/** Builds the route tree. A page that throws while rendering is replaced by `RouteErrorPage`, and the layout stays. */
export function buildRoutes(pages: RouteObject[]): RouteObject[] {
    return [{ element: <RootLayout />, children: [{ errorElement: <RouteErrorPage />, children: pages }] }];
}

export const routes = buildRoutes(pageRoutes);
