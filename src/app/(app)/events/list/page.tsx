'use client';

import { useEffect, useState } from 'react';
import { getEvents, Event } from '@/server/actions/events/actions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

export default function EventsListPage() {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        getEvents().then(setEvents);
    }, []);

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Eventos y Meetups 📅" subtitle="Conecta en vivo en ambientes seguros" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                        <div className="h-32 bg-indigo-100 flex items-center justify-center text-indigo-300">
                            {/* Placeholder for event cover */}
                            <Calendar size={48} />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Users size={14} /> {event.attendees?.length || 0} confirmados
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/events/${event.id}`} className="w-full">
                                <Button className="w-full">Ver Detalles</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {events.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        No hay eventos próximos. ¡Sé el primero en crear uno!
                    </div>
                )}
            </div>
        </div>
    );
}
