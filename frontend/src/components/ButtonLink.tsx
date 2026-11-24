import type { ReactNode } from 'react';
import { Link, type To } from 'react-router';

export type ButtonVariant = 'primary' | 'quiet';

const base =
    'inline-flex items-center justify-center gap-2 rounded-control border-[1.5px] px-5 py-3.5 font-ui text-base font-semibold leading-none no-underline transition-colors';
const variantClass: Record<ButtonVariant, string> = {
    primary: 'border-accent bg-accent text-accent-ink hover:bg-accent/85',
    quiet: 'border-transparent px-1.5! text-ink underline underline-offset-4 hover:decoration-2',
};

interface ButtonLinkProps {
    variant: ButtonVariant;
    to: To;
    children: ReactNode;
    'data-test-id'?: string;
}

/** A router link styled as a button: the hero's View work and Contact me actions. */
export function ButtonLink({ variant, to, children, ...rest }: ButtonLinkProps) {
    return (
        <Link to={to} className={`${base} ${variantClass[variant]}`} {...rest}>
            {children}
        </Link>
    );
}
