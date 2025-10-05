import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Filter, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterField {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    placeholder?: string;
    options?: { value: string; label: string }[];
    value?: string | number;
}

interface FilterFormProps {
    fields: FilterField[];
    onFilter: (filters: Record<string, any>) => void;
    onReset: () => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: () => void;
    isExpanded?: boolean;
    className?: string;
}

export default function FilterForm({
    fields,
    onFilter,
    onReset,
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
    isExpanded = false,
    className = '',
}: FilterFormProps) {
    const [expanded, setExpanded] = useState(isExpanded);
    const [localSearchValue, setLocalSearchValue] = useState(searchValue);
    const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.forEach(field => {
            initial[field.name] = field.value || '';
        });
        return initial;
    });

    const handleSearchChange = (value: string) => {
        setLocalSearchValue(value);
        onSearchChange?.(value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchSubmit?.();
    };

    const handleFieldChange = (name: string, value: any) => {
        setFilterValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFilter = () => {
        onFilter(filterValues);
    };

    const handleReset = () => {
        setFilterValues(() => {
            const initial: Record<string, any> = {};
            fields.forEach(field => {
                initial[field.name] = '';
            });
            return initial;
        });
        setLocalSearchValue('');
        onReset();
    };

    const handleClearSearch = () => {
        setLocalSearchValue('');
        onSearchChange?.('');
        onSearchSubmit?.();
    };

    return (
        <Card className={`mb-6 ${className}`}>
            <CardContent className="p-4">
                {/* Search Bar - Always Visible */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Cari..."
                                value={localSearchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {localSearchValue && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Filter Toggle Button */}
                    <Collapsible open={expanded} onOpenChange={setExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {expanded ? (
                                    <ChevronUp className="h-4 w-4 ml-2" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                )}
                            </Button>
                        </CollapsibleTrigger>

                        {/* Expandable Filter Form */}
                        <CollapsibleContent className="mt-4">
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                    {fields.map((field) => (
                                        <div key={field.name} className="space-y-2">
                                            <Label htmlFor={field.name} className="text-sm font-medium">
                                                {field.label}
                                            </Label>
                                            {field.type === 'select' ? (
                                                <Select
                                                    value={filterValues[field.name]}
                                                    onValueChange={(value) => handleFieldChange(field.name, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options?.map((option) => (
                                                            <SelectItem 
                                                                key={option.value || 'empty'} 
                                                                value={option.value || 'empty'}
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    id={field.name}
                                                    type={field.type}
                                                    placeholder={field.placeholder || field.label}
                                                    value={filterValues[field.name]}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Filter Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={handleFilter} size="sm">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Terapkan Filter
                                    </Button>
                                    <Button onClick={handleReset} variant="outline" size="sm">
                                        <X className="h-4 w-4 mr-2" />
                                        Reset Filter
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </CardContent>
        </Card>
    );
}