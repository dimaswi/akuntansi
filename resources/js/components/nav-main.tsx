import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sidebar-nav-open';

function loadOpenState(): Record<string, boolean> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function persistOpenState(state: Record<string, boolean>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const { hasPermission } = usePermission();
    const [openMap, setOpenMap] = useState<Record<string, boolean>>(loadOpenState);

    /** Basic path match: exact or continues with "/" */
    const pathMatches = (href: string) => {
        const currentPath = page.url.split('?')[0];
        return currentPath === href || currentPath.startsWith(href + '/');
    };

    /** For top-level items without children */
    const isActive = (href: string) => {
        if (href === '/dashboard') return page.url.split('?')[0] === '/dashboard';
        return pathMatches(href);
    };

    /**
     * Among a list of sibling children, find the single most-specific match.
     * This prevents /akuntansi from being active when /akuntansi/jurnal-penyesuaian
     * is a better match, and prevents /akuntansi/jurnal from matching /akuntansi/jurnal-penyesuaian.
     */
    const getActiveChildHref = (children: NavItem[]): string | null => {
        let best: NavItem | null = null;
        for (const child of children) {
            if (pathMatches(child.href)) {
                if (!best || child.href.length > best.href.length) {
                    best = child;
                }
            }
        }
        return best?.href ?? null;
    };

    const isChildActive = (item: NavItem): boolean => {
        if (!item.children) return false;
        return item.children.some((child) => pathMatches(child.href));
    };

    const hasAccess = (item: NavItem): boolean => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
    };

    const getIsOpen = (item: NavItem): boolean => {
        if (item.title in openMap) return openMap[item.title];
        return isChildActive(item);
    };

    const handleToggle = useCallback((title: string) => {
        setOpenMap((prev) => {
            const next = { ...prev, [title]: !prev[title] };
            // If title wasn't in prev, it was implicitly open (from isChildActive fallback) — so close it
            if (!(title in prev)) next[title] = false;
            persistOpenState(next);
            return next;
        });
    }, []);

    const renderItem = (item: NavItem) => {
        if (!item.children) {
            if (!hasAccess(item)) return null;
            return (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={{ children: item.title }}
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        }

        const accessibleChildren = item.children.filter(hasAccess);
        if (accessibleChildren.length === 0) return null;

        const childActive = isChildActive(item);
        const isOpen = getIsOpen(item);
        const activeChildHref = getActiveChildHref(accessibleChildren);

        return (
            <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={() => handleToggle(item.title)}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            tooltip={{ children: item.title }}
                            isActive={childActive}
                            className="font-medium"
                        >
                            {item.icon && <item.icon className="shrink-0" />}
                            <span>{item.title}</span>
                            <ChevronDown
                                className={cn(
                                    'ml-auto h-4 w-4 shrink-0 transition-transform duration-200',
                                    isOpen && 'rotate-180',
                                )}
                            />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub className="border-l-0">
                            {accessibleChildren.map((child, index) => {
                                const active = child.href === activeChildHref;
                                const isLast = index === accessibleChildren.length - 1;
                                return (
                                    <SidebarMenuSubItem key={child.title}>
                                        {/* Vertical line segment */}
                                        <span
                                            className="absolute w-px bg-sidebar-foreground/15"
                                            style={{
                                                left: '-0.625rem',
                                                top: 0,
                                                ...(isLast
                                                    ? { height: '50%' }
                                                    : { bottom: '-0.25rem' }),
                                            }}
                                        />
                                        {/* Horizontal connecting line */}
                                        <span
                                            className="absolute top-1/2 h-px bg-sidebar-foreground/15"
                                            style={{
                                                left: '-0.625rem',
                                                width: '0.625rem',
                                            }}
                                        />
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={active}
                                            className={cn(
                                                active && '!bg-sidebar-foreground !text-sidebar hover:!bg-sidebar-foreground hover:!text-sidebar',
                                            )}
                                        >
                                            <Link href={child.href} prefetch>
                                                <span
                                                    className={cn(
                                                        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                                                        active
                                                            ? '!bg-sidebar'
                                                            : 'bg-sidebar-foreground/30',
                                                    )}
                                                />
                                                <span>{child.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu>
                {items.map(renderItem)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
