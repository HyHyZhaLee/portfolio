import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { RootLayout } from './RootLayout';

/** The case-study page, with its diagram kit and data, is its own chunk that the home page never downloads (PF-026 D1). */
const CaseStudyPage = lazy(() => import('../pages/CaseStudyPage').then((module) => ({ default: module.CaseStudyPage })));

/**
 * The pages that can render inside the layout. An unknown `/work/` slug renders the 404 page from `CaseStudyPage`.
 * `RootLayout`'s `Suspense` boundary holds the lazy page: a boundary created with the route would show its empty fallback even inside a transition.
 */
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
