import type { ReactNode } from 'react';
import { Link, type To } from 'react-router';

export type ButtonVariant = 'primary' | 'outline' | 'quiet';

const base = 'inline-flex items-center justify-center gap-2 rounded-control border-[1.5px] font-ui font-semibold leading-none no-underline transition-colors';
const variantClass: Record<ButtonVariant, string> = {
    primary: 'border-accent bg-accent text-accent-ink hover:bg-accent/85',
    outline: 'border-ink text-ink hover:bg-surface-sunk',
    quiet: 'border-transparent px-1.5! text-ink underline underline-offset-4 hover:decoration-2',
};
const sizeClass = { default: 'px-5 py-3.5 text-base', small: 'px-3.5 py-2.5 text-sm' } as const;

interface CommonProps {
    variant?: ButtonVariant;
    size?: keyof typeof sizeClass;
    className?: string;
    children: ReactNode;
    'data-test-id'?: string;
}

/** A link styled as a button: a route (`to`) renders a router link, a file or external URL (`href`) a plain anchor. */
export type ButtonLinkProps = CommonProps & ({ to: To; href?: never } | { href: string; to?: never });

export function ButtonLink({ variant = 'outline', size = 'default', className = '', children, to, href, ...rest }: ButtonLinkProps) {
    const classes = `${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`;
    if (to !== undefined) {
        return (
            <Link to={to} className={classes} {...rest}>
                {children}
            </Link>
        );
    }
    return (
        <a href={href} className={classes} {...rest}>
            {children}
        </a>
    );
}
