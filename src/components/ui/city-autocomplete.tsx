'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { searchCities, type LocationResult } from '@/lib/location';
import { MapPin } from 'lucide-react';

interface CityAutocompleteProps {
    value: string;
    onSelect: (location: LocationResult) => void;
    placeholder?: string;
    className?: string;
}

export function CityAutocomplete({ value, onSelect, placeholder = "Buscar ciudad...", className }: CityAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length >= 2) {
            const timer = setTimeout(() => {
                const matches = searchCities(query, 8);
                setResults(matches);
                setIsOpen(matches.length > 0);
                setHighlightIndex(-1);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            selectResult(results[highlightIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }

    function selectResult(result: LocationResult) {
        setQuery(`${result.city.name}, ${result.country.name}`);
        setIsOpen(false);
        onSelect(result);
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-9"
                    autoComplete="off"
                />
            </div>
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {results.map((result, index) => (
                        <button
                            key={result.city.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                                index === highlightIndex ? 'bg-muted/50' : ''
                            }`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectResult(result);
                            }}
                            onMouseEnter={() => setHighlightIndex(index)}
                        >
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                                <div className="font-medium text-sm">{result.city.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {result.city.stateCode}, {result.country.name}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
