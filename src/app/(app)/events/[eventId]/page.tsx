export default function EventDetailPage({ params }: { params: { eventId: string } }) {
    return (
        <div className="md:pl-60 p-6">
            <h1 className="text-3xl font-bold">Detalle del Evento {params.eventId}</h1>
            <p className="opacity-60">Página de detalle en construcción (Mock)</p>
        </div>
    );
}
