import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';

export interface FilterField {
    name: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number';
    placeholder?: string;
    options?: { value: string; label: string }[];
    value?: string | number;
}

interface FilterButtonProps {
    fields: FilterField[];
    onFilter: (filters: Record<string, any>) => void;
    onReset: () => void;
    className?: string;
}

export default function FilterButton({
    fields,
    onFilter,
    onReset,
    className = '',
}: FilterButtonProps) {
    const [open, setOpen] = useState(false);
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
        setOpen(false);
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
        setOpen(false);
    };

    // Check if any filter has a value
    const hasActiveFilters = Object.values(filterValues).some(value => 
        value !== '' && value !== null && value !== undefined
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''} ${className}`}
                >
                    <Filter className="h-4 w-4" />
                    Filter
                    {hasActiveFilters && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                            {Object.values(filterValues).filter(v => v !== '' && v !== null && v !== undefined).length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filter</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    
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

                    <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="flex-1"
                        >
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApplyFilter}
                            className="flex-1"
                        >
                            Terapkan Filter
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}