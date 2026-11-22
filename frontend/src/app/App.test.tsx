import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestIds } from '../config/test-ids.config';
import { App } from './App';

describe('App', () => {
    it('renders the home page with the real providers and browser router', () => {
        render(<App />);

        expect(screen.getByTestId(TestIds.home.heading)).toBeInTheDocument();
    });
});
