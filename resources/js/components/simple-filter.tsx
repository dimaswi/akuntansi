import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

export interface FilterField {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    placeholder?: string;
    options?: { value: string; label: string }[];
    value?: string | number;
}

interface SimpleFilterProps {
    fields: FilterField[];
    onFilter: (filters: Record<string, any>) => void;
    onReset: () => void;
    className?: string;
    variant?: 'inline' | 'popover';
}

export default function SimpleFilter({
    fields,
    onFilter,
    onReset,
    className = '',
}: SimpleFilterProps) {
    const [expanded, setExpanded] = useState(false);
    const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        fields.forEach(field => {
            initial[field.name] = field.value || '';
        });
        return initial;
    });

    const handleFieldChange = (name: string, value: any) => {
        setFilterValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilter = () => {
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
        onReset();
    };

    // Check if any filter has a value
    const hasActiveFilters = Object.values(filterValues).some(value => 
        value !== '' && value !== null && value !== undefined && value !== 'all'
    );

    return (
        <Card className={`${className}`}>
            <CardContent className="p-4">
                <Collapsible open={expanded} onOpenChange={setExpanded}>
                    <CollapsibleTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`w-full flex items-center justify-between ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                                {hasActiveFilters && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                                        {Object.values(filterValues).filter(v => v !== '' && v !== null && v !== undefined && v !== 'all').length}
                                    </span>
                                )}
                            </div>
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                className="flex items-center gap-1"
                            >
                                <X className="h-4 w-4" />
                                Reset
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApplyFilter}
                                className="flex items-center gap-1"
                            >
                                <Filter className="h-4 w-4" />
                                Terapkan Filter
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}