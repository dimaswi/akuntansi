import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

interface Account {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun?: string;
}

interface SearchableAccountSelectTableProps {
    accounts: Account[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableAccountSelectTable({
    accounts,
    value,
    onValueChange,
    placeholder = "Pilih akun...",
    className,
    disabled = false,
}: SearchableAccountSelectTableProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Get selected account
    const selectedAccount = accounts.find(account => account.id.toString() === value);

    // Filter accounts based on search
    const filteredAccounts = React.useMemo(() => {
        if (!searchValue) return accounts;
        
        const search = searchValue.toLowerCase();
        return accounts.filter(account => 
            account.kode_akun.toLowerCase().includes(search) ||
            account.nama_akun.toLowerCase().includes(search)
        );
    }, [accounts, searchValue]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
                e.preventDefault();
                if (open && highlightedIndex >= 0 && highlightedIndex < filteredAccounts.length) {
                    onValueChange(filteredAccounts[highlightedIndex].id.toString());
                    setOpen(false);
                    setSearchValue("");
                    setHighlightedIndex(-1);
                } else if (!open) {
                    setOpen(true);
                }
                break;
            case "Escape":
                setOpen(false);
                setSearchValue("");
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                break;
            case "ArrowDown":
                e.preventDefault();
                if (!open) {
                    setOpen(true);
                } else {
                    setHighlightedIndex(prev => 
                        prev < filteredAccounts.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case "ArrowUp":
                e.preventDefault();
                if (open) {
                    setHighlightedIndex(prev => 
                        prev > 0 ? prev - 1 : filteredAccounts.length - 1
                    );
                }
                break;
        }
    };

    // Scroll highlighted item into view
    React.useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth"
                });
            }
        }
    }, [highlightedIndex]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.closest('.relative')?.contains(event.target as Node)) {
                setOpen(false);
                setSearchValue("");
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (account: Account) => {
        onValueChange(account.id.toString());
        setOpen(false);
        setSearchValue("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onValueChange("");
        setSearchValue("");
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const displayValue = open ? searchValue : (selectedAccount ? `${selectedAccount.kode_akun} - ${selectedAccount.nama_akun}` : "");

    return (
        <div className={cn("relative", className)}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        if (!open) setOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                        if (!disabled) {
                            setOpen(true);
                            if (selectedAccount) setSearchValue("");
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pr-16 h-8 text-xs"
                />
                
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {selectedAccount && !disabled && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => !disabled && setOpen(!open)}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        disabled={disabled}
                    >
                        <ChevronDown className={cn(
                            "h-3 w-3 transition-transform",
                            open ? "rotate-180" : ""
                        )} />
                    </Button>
                </div>
            </div>

            {open && !disabled && (
                <div 
                    ref={listRef}
                    className="fixed z-[9999] max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl"
                    style={{
                      top: position.top,
                      left: position.left,
                      width: Math.max(position.width, 300),
                      minWidth: 300,
                    }}
                >
                    {filteredAccounts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {searchValue ? "Tidak ada akun yang ditemukan" : "Tidak ada data"}
                        </div>
                    ) : (
                        filteredAccounts.map((account, index) => (
                            <div
                                key={account.id}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur
                                    handleSelect(account);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(account);
                                }}
                                className={cn(
                                    "px-3 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                                    "hover:bg-gray-50 dark:hover:bg-gray-700",
                                    index === highlightedIndex ? "bg-blue-50 dark:bg-blue-900/30" : "",
                                    selectedAccount?.id === account.id ? "bg-blue-100 dark:bg-blue-900/50" : ""
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {account.kode_akun} - {account.nama_akun}
                                        </div>
                                        {account.jenis_akun && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {account.jenis_akun.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>
                                    {selectedAccount?.id === account.id && (
                                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
