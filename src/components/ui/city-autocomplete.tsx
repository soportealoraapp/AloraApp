'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { searchCities, type LocationResult } from '@/lib/location';
import { MapPin, Loader2 } from 'lucide-react';

interface CityAutocompleteProps {
    value: string;
    onSelect: (location: LocationResult) => void;
    placeholder?: string;
    className?: string;
}

export function CityAutocomplete({ value, onSelect, placeholder = "Buscar ciudad...", className }: CityAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<LocationResult[]>([]);

    useEffect(() => {
        setQuery(value);
    }, [value]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [source, setSource] = useState<'nominatim' | 'local' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchResults = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setIsOpen(false);
            setSource(null);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);

        try {
            const response = await fetch(
                `/api/location/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
                { signal: controller.signal }
            );

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.results || []);
            setSource(data.source || 'local');
            setIsOpen((data.results || []).length > 0);
            setHighlightIndex(-1);
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                const localResults = searchCities(searchQuery, 8);
                setResults(localResults);
                setSource('local');
                setIsOpen(localResults.length > 0);
                setHighlightIndex(-1);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, fetchResults]);

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
                {loading ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
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
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto" role="listbox" aria-label="Ciudades disponibles">
                    {results.map((result, index) => (
                        <button
                            key={result.city.id}
                            type="button"
                            role="option"
                            aria-selected={index === highlightIndex}
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
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{result.city.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {[result.city.stateCode, result.country.name].filter(Boolean).join(', ')}
                                </div>
                            </div>
                            {source === 'nominatim' && index === 0 && (
                                <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">Global</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
