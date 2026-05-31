export interface QuizQuestion {
    id: string;
    question: string;
    text?: string; // alias for question (used by compatibility page)
    type?: 'choice' | 'scale'; // question type
    options: { id: string; text: string; value?: string; score: number }[];
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    questions: QuizQuestion[];
}

export const COMPATIBILITY_QUIZZES: Quiz[] = [
    {
        id: 'valores-fundamentales',
        title: 'Valores Fundamentales',
        description: 'Descubre qué valores son más importantes para ti en una relación',
        category: 'Valores',
        icon: 'Heart',
        questions: [
            {
                id: 'v1',
                question: '¿Qué es lo más importante en una relación?',
                options: [
                    { id: 'a', text: 'Confianza y honestidad', score: 10 },
                    { id: 'b', text: 'Diversión y aventura', score: 7 },
                    { id: 'c', text: 'Apoyo mutuo', score: 9 },
                    { id: 'd', text: 'Independencia', score: 5 }
                ]
            },
            {
                id: 'v2',
                question: '¿Cómo prefieres resolver los conflictos?',
                options: [
                    { id: 'a', text: 'Hablando directamente', score: 10 },
                    { id: 'b', text: 'Tomándose un tiempo', score: 7 },
                    { id: 'c', text: 'Buscando un compromiso', score: 9 },
                    { id: 'd', text: 'Evitando el tema', score: 3 }
                ]
            },
            {
                id: 'v3',
                question: '¿Qué tan importante es la familia para ti?',
                options: [
                    { id: 'a', text: 'Lo más importante', score: 10 },
                    { id: 'b', text: 'Muy importante', score: 8 },
                    { id: 'c', text: 'Importante pero no es todo', score: 6 },
                    { id: 'd', text: 'No es prioridad ahora', score: 4 }
                ]
            },
            {
                id: 'v4',
                question: '¿Qué buscas en una relación?',
                options: [
                    { id: 'a', text: 'Algo serio y duradero', score: 10 },
                    { id: 'b', text: 'Conocer gente nueva', score: 6 },
                    { id: 'c', text: 'Ver qué pasa', score: 5 },
                    { id: 'd', text: 'Amistad con posibilidades', score: 7 }
                ]
            },
            {
                id: 'v5',
                question: '¿Cómo te gusta expresar el amor?',
                options: [
                    { id: 'a', text: 'Con palabras y comunicación', score: 10 },
                    { id: 'b', text: 'Con actos de servicio', score: 9 },
                    { id: 'c', text: 'Con tiempo de calidad', score: 8 },
                    { id: 'd', text: 'Con detalles y regalos', score: 6 }
                ]
            },
            {
                id: 'v6',
                question: '¿Qué opinas sobre la honestidad radical?',
                options: [
                    { id: 'a', text: 'Es fundamental', score: 10 },
                    { id: 'b', text: 'Depende del contexto', score: 7 },
                    { id: 'c', text: 'A veces una blanca no hace daño', score: 5 },
                    { id: 'd', text: 'Prefiero no saber todo', score: 3 }
                ]
            },
            {
                id: 'v7',
                question: '¿Qué tan importante es la estabilidad financiera?',
                options: [
                    { id: 'a', text: 'Muy importante', score: 8 },
                    { id: 'b', text: 'Importante pero no es todo', score: 7 },
                    { id: 'c', text: 'Me importa más la conexión', score: 6 },
                    { id: 'd', text: 'No me preocupa', score: 4 }
                ]
            },
            {
                id: 'v8',
                question: '¿Cómo manejas los celos?',
                options: [
                    { id: 'a', text: 'Los comunico abiertamente', score: 10 },
                    { id: 'b', text: 'Trabajo en mi seguridad', score: 8 },
                    { id: 'c', text: 'A veces me cuesta', score: 5 },
                    { id: 'd', text: 'No soy celoso/a', score: 7 }
                ]
            },
            {
                id: 'v9',
                question: '¿Qué valoras más de ti mismo/a?',
                options: [
                    { id: 'a', text: 'Mi capacidad de amar', score: 10 },
                    { id: 'b', text: 'Mi independencia', score: 7 },
                    { id: 'c', text: 'Mi sentido del humor', score: 8 },
                    { id: 'd', text: 'Mi ambición', score: 6 }
                ]
            },
            {
                id: 'v10',
                question: '¿Cuál es tu visión de una relación exitosa?',
                options: [
                    { id: 'a', text: 'Crecer juntos', score: 10 },
                    { id: 'b', text: 'Mantener la chispa', score: 8 },
                    { id: 'c', text: 'Respeto y companionship', score: 9 },
                    { id: 'd', text: 'Superar juntos los retos', score: 9 }
                ]
            }
        ]
    },
    {
        id: 'comunicacion',
        title: 'Estilo de Comunicación',
        description: 'Cómo te comunicas y qué necesitas de tu pareja',
        category: 'Comunicación',
        icon: 'MessageCircle',
        questions: [
            {
                id: 'c1',
                question: '¿Cómo prefieres comunicar algo importante?',
                options: [
                    { id: 'a', text: 'En persona, cara a cara', score: 10 },
                    { id: 'b', text: 'Por mensaje para organizar ideas', score: 6 },
                    { id: 'c', text: 'Por llamada de voz', score: 8 },
                    { id: 'd', text: 'Depende de la situación', score: 7 }
                ]
            },
            {
                id: 'c2',
                question: '¿Qué haces cuando estás molesto/a?',
                options: [
                    { id: 'a', text: 'Lo digo inmediatamente', score: 8 },
                    { id: 'b', text: 'Me calmo primero y luego hablo', score: 10 },
                    { id: 'c', text: 'Espero a que pase', score: 4 },
                    { id: 'd', text: 'Necesito tiempo a solas', score: 7 }
                ]
            },
            {
                id: 'c3',
                question: '¿Qué tan表达ivo eres emocionalmente?',
                options: [
                    { id: 'a', text: 'Muy表达ivo, me gusta hablar de sentimientos', score: 9 },
                    { id: 'b', text: 'Moderado, depende de la confianza', score: 8 },
                    { id: 'c', text: 'Reservado, pero escucho', score: 6 },
                    { id: 'd', text: 'Prefiero mostrarlo con acciones', score: 7 }
                ]
            },
            {
                id: 'c4',
                question: '¿Qué necesitas cuando estás triste?',
                options: [
                    { id: 'a', text: 'Que me escuchen sin juzgar', score: 10 },
                    { id: 'b', text: 'Un abrazo y compañía', score: 9 },
                    { id: 'c', text: 'Que me den espacio', score: 6 },
                    { id: 'd', text: 'Que me ayuden a resolver el problema', score: 7 }
                ]
            },
            {
                id: 'c5',
                question: '¿Cómo te gusta recibir feedback?',
                options: [
                    { id: 'a', text: 'Directo y honesto', score: 10 },
                    { id: 'b', text: 'Con tacto y consideración', score: 8 },
                    { id: 'c', text: 'En el momento adecuado', score: 7 },
                    { id: 'd', text: 'Prefiero no recibirlo', score: 3 }
                ]
            },
            {
                id: 'c6',
                question: '¿Qué tan importante es el humor en tus conversaciones?',
                options: [
                    { id: 'a', text: 'Fundamental, todo debe tener humor', score: 8 },
                    { id: 'b', text: 'Importante, pero sé cuándo ser serio', score: 10 },
                    { id: 'c', text: 'No es lo más importante', score: 5 },
                    { id: 'd', text: 'Prefiero conversaciones profundas', score: 7 }
                ]
            },
            {
                id: 'c7',
                question: '¿Cómo manejas las conversaciones difíciles?',
                options: [
                    { id: 'a', text: 'Enfrento el problema de frente', score: 9 },
                    { id: 'b', text: 'Preparo lo que voy a decir', score: 8 },
                    { id: 'c', text: 'Evito el conflicto', score: 3 },
                    { id: 'd', text: 'Busco mediación si es necesario', score: 7 }
                ]
            },
            {
                id: 'c8',
                question: '¿Qué tan importante es la comunicación no verbal para ti?',
                options: [
                    { id: 'a', text: 'Muy importante, leo mucho el lenguaje corporal', score: 9 },
                    { id: 'b', text: 'Algo importante', score: 7 },
                    { id: 'c', text: 'No le presto mucha atención', score: 4 },
                    { id: 'd', text: 'Depende de la persona', score: 6 }
                ]
            },
            {
                id: 'c9',
                question: '¿Cómo prefieres resolver malentendidos?',
                options: [
                    { id: 'a', text: 'Aclarando inmediatamente', score: 10 },
                    { id: 'b', text: 'Conversando calmadamente', score: 9 },
                    { id: 'c', text: 'Esperando a que se resuelva solo', score: 3 },
                    { id: 'd', text: 'Pidiendo una tercera opinión', score: 5 }
                ]
            },
            {
                id: 'c10',
                question: '¿Qué buscas en una buena conversación?',
                options: [
                    { id: 'a', text: 'Profundidad y conexión', score: 10 },
                    { id: 'b', text: 'Diversión y risas', score: 8 },
                    { id: 'c', text: 'Aprender algo nuevo', score: 7 },
                    { id: 'd', text: 'Compartir experiencias', score: 8 }
                ]
            }
        ]
    },
    {
        id: 'estilo-vida',
        title: 'Estilo de Vida',
        description: 'Cómo vives tu día a día y qué rutinas tienes',
        category: 'Estilo de Vida',
        icon: 'Sun',
        questions: [
            {
                id: 'l1',
                question: '¿Eres más de mañana o de noche?',
                options: [
                    { id: 'a', text: 'Mañana, me encanta el amanecer', score: 8 },
                    { id: 'b', text: 'Noche, soy más productivo/a', score: 8 },
                    { id: 'c', text: 'Ambos, depende del día', score: 7 },
                    { id: 'd', text: 'No tengo horario fijo', score: 5 }
                ]
            },
            {
                id: 'l2',
                question: '¿Cómo te gusta pasar tu tiempo libre?',
                options: [
                    { id: 'a', text: 'Explorando nuevos lugares', score: 9 },
                    { id: 'b', text: 'En casa relajándome', score: 7 },
                    { id: 'c', text: 'Haciendo ejercicio', score: 8 },
                    { id: 'd', text: 'Con amigos y familia', score: 8 }
                ]
            },
            {
                id: 'l3',
                question: '¿Qué tan activo/a eres?',
                options: [
                    { id: 'a', text: 'Muy activo, hago ejercicio regularmente', score: 9 },
                    { id: 'b', text: 'Moderadamente activo/a', score: 7 },
                    { id: 'c', text: 'Prefiero actividades tranquilas', score: 5 },
                    { id: 'd', text: 'Sedentario/a pero intento cambiar', score: 4 }
                ]
            },
            {
                id: 'l4',
                question: '¿Cómo es tu espacio personal?',
                options: [
                    { id: 'a', text: 'Ordenado y minimalista', score: 8 },
                    { id: 'b', text: 'Acogedor y personalizado', score: 9 },
                    { id: 'c', text: 'Un poco desordenado pero funcional', score: 6 },
                    { id: 'd', text: 'Siempre cambiando', score: 5 }
                ]
            },
            {
                id: 'l5',
                question: '¿Qué tan importante es la salud para ti?',
                options: [
                    { id: 'a', text: 'Lo más importante', score: 10 },
                    { id: 'b', text: 'Muy importante', score: 8 },
                    { id: 'c', text: 'Intento cuidarme', score: 6 },
                    { id: 'd', text: 'No le doy mucha prioridad', score: 3 }
                ]
            },
            {
                id: 'l6',
                question: '¿Cómo manejas el estrés?',
                options: [
                    { id: 'a', text: 'Ejercicio y meditación', score: 9 },
                    { id: 'b', text: 'Hablando con alguien', score: 8 },
                    { id: 'c', text: 'Me aíslo un tiempo', score: 6 },
                    { id: 'd', text: 'Busco distracción', score: 5 }
                ]
            },
            {
                id: 'l7',
                question: '¿Qué tan organizado/a eres?',
                options: [
                    { id: 'a', text: 'Muy, todo tiene su lugar', score: 8 },
                    { id: 'b', text: 'Algo organizado/a', score: 7 },
                    { id: 'c', text: 'Espontáneo/a', score: 6 },
                    { id: 'd', text: 'Caótico/a pero funcional', score: 4 }
                ]
            },
            {
                id: 'l8',
                question: '¿Qué tipo de música escuchas?',
                options: [
                    { id: 'a', text: 'De todo, soy ecléctico/a', score: 8 },
                    { id: 'b', text: 'Principalmente un género', score: 7 },
                    { id: 'c', text: 'Lo que suene bien', score: 6 },
                    { id: 'd', text: 'Poca música, prefiero podcasts', score: 5 }
                ]
            },
            {
                id: 'l9',
                question: '¿Cómo es tu relación con la tecnología?',
                options: [
                    { id: 'a', text: 'Amante de la tecnología', score: 7 },
                    { id: 'b', text: 'Uso lo necesario', score: 8 },
                    { id: 'c', text: 'Intento desconectarme', score: 9 },
                    { id: 'd', text: 'Depende del dispositivo', score: 6 }
                ]
            },
            {
                id: 'l10',
                question: '¿Qué tan aventurero/a eres?',
                options: [
                    { id: 'a', text: 'Muy, me encanta explorar', score: 10 },
                    { id: 'b', text: 'Algo aventurero/a', score: 7 },
                    { id: 'c', text: 'Prefiero la zona de confort', score: 4 },
                    { id: 'd', text: 'Depende de la compañía', score: 8 }
                ]
            }
        ]
    },
    {
        id: 'relaciones',
        title: 'Relaciones y Experiencias',
        description: 'Tu historia relational y qué has aprendido',
        category: 'Relaciones',
        icon: 'Users',
        questions: [
            {
                id: 'r1',
                question: '¿Qué aprendiste de tu última relación?',
                options: [
                    { id: 'a', text: 'A comunicarme mejor', score: 10 },
                    { id: 'b', text: 'A poner límites', score: 9 },
                    { id: 'c', text: 'Que necesito tiempo para mí', score: 7 },
                    { id: 'd', text: 'Que no soy perfecto/a', score: 8 }
                ]
            },
            {
                id: 'r2',
                question: '¿Cuánto tiempo necesitas para conocer a alguien?',
                options: [
                    { id: 'a', text: 'Poco, confío en mi instinto', score: 5 },
                    { id: 'b', text: 'Algunas semanas', score: 7 },
                    { id: 'c', text: 'Varios meses', score: 9 },
                    { id: 'd', text: 'Depende de la conexión', score: 8 }
                ]
            },
            {
                id: 'r3',
                question: '¿Qué es un dealbreaker para ti?',
                options: [
                    { id: 'a', text: 'Falta de honestidad', score: 10 },
                    { id: 'b', text: 'Falta de respeto', score: 10 },
                    { id: 'c', text: 'No tener metas', score: 7 },
                    { id: 'd', text: 'Mala relación con su familia', score: 5 }
                ]
            },
            {
                id: 'r4',
                question: '¿Cómo te gusta que te demuestren amor?',
                options: [
                    { id: 'a', text: 'Con palabras', score: 8 },
                    { id: 'b', text: 'Con detalles', score: 7 },
                    { id: 'c', text: 'Con tiempo juntos', score: 9 },
                    { id: 'd', text: 'Con apoyo en momentos difíciles', score: 10 }
                ]
            },
            {
                id: 'r5',
                question: '¿Qué tan importante es la química física?',
                options: [
                    { id: 'a', text: 'Muy importante', score: 8 },
                    { id: 'b', text: 'Importante pero no es todo', score: 9 },
                    { id: 'c', text: 'Lo importante es la conexión emocional', score: 10 },
                    { id: 'd', text: 'Crecerá con el tiempo', score: 7 }
                ]
            },
            {
                id: 'r6',
                question: '¿Cómo manejas las relaciones a distancia?',
                options: [
                    { id: 'a', text: 'Funciona con confianza', score: 7 },
                    { id: 'b', text: 'Prefiero cercanía física', score: 6 },
                    { id: 'c', text: 'Lo intentaría si vale la pena', score: 8 },
                    { id: 'd', text: 'No es para mí', score: 4 }
                ]
            },
            {
                id: 'r7',
                question: '¿Qué tan importante es la compatibilidad sexual?',
                options: [
                    { id: 'a', text: 'Fundamental', score: 8 },
                    { id: 'b', text: 'Muy importante', score: 8 },
                    { id: 'c', text: 'Importante pero negociable', score: 7 },
                    { id: 'd', text: 'No es lo más importante', score: 5 }
                ]
            },
            {
                id: 'r8',
                question: '¿Cómo te sientes sobre las PDA (demostraciones públicas)?',
                options: [
                    { id: 'a', text: 'Me encantan', score: 7 },
                    { id: 'b', text: 'Algo de cariño está bien', score: 8 },
                    { id: 'c', text: 'Prefiero la intimidad privada', score: 6 },
                    { id: 'd', text: 'Depende del lugar', score: 7 }
                ]
            },
            {
                id: 'r9',
                question: '¿Qué tan importante es la monogamia para ti?',
                options: [
                    { id: 'a', text: 'Es lo único que acepto', score: 10 },
                    { id: 'b', text: 'Es mi preferencia', score: 9 },
                    { id: 'c', text: 'Estoy abierto/a a discutirlo', score: 5 },
                    { id: 'd', text: 'Prefiero no etiquetas', score: 4 }
                ]
            },
            {
                id: 'r10',
                question: '¿Qué buscas en tu próxima relación?',
                options: [
                    { id: 'a', text: 'Algo duradero y profundo', score: 10 },
                    { id: 'b', text: 'Conexión genuina', score: 9 },
                    { id: 'c', text: 'Compañía y diversión', score: 6 },
                    { id: 'd', text: 'Vamos viendo qué pasa', score: 5 }
                ]
            }
        ]
    },
    {
        id: 'familia',
        title: 'Familia y Futuro',
        description: 'Tus planes de vida y visión del futuro',
        category: 'Familia',
        icon: 'Home',
        questions: [
            {
                id: 'f1',
                question: '¿Quieres tener hijos?',
                options: [
                    { id: 'a', text: 'Sí, definitivamente', score: 10 },
                    { id: 'b', text: 'Tal vez en el futuro', score: 7 },
                    { id: 'c', text: 'No estoy seguro/a', score: 5 },
                    { id: 'd', text: 'No, no es para mí', score: 3 }
                ]
            },
            {
                id: 'f2',
                question: '¿Cómo sería tu familia ideal?',
                options: [
                    { id: 'a', text: 'Grande y ruidosa', score: 8 },
                    { id: 'b', text: 'Pequeña e íntima', score: 7 },
                    { id: 'c', text: 'Con mascotas como hijos', score: 6 },
                    { id: 'd', text: 'Sin planes específicos', score: 4 }
                ]
            },
            {
                id: 'f3',
                question: '¿Qué tan importante es la aprobación familiar?',
                options: [
                    { id: 'a', text: 'Muy importante', score: 8 },
                    { id: 'b', text: 'Importante pero no decisivo', score: 7 },
                    { id: 'c', text: 'No me importa tanto', score: 5 },
                    { id: 'd', text: 'Prefiero mantener límites', score: 6 }
                ]
            },
            {
                id: 'f4',
                question: '¿Cómo manejarías las diferencias culturales?',
                options: [
                    { id: 'a', text: 'Celebrando ambas culturas', score: 10 },
                    { id: 'b', text: 'Adaptándome gradualmente', score: 8 },
                    { id: 'c', text: 'Creando nuestra propia cultura', score: 9 },
                    { id: 'd', text: 'Puede ser un desafío', score: 5 }
                ]
            },
            {
                id: 'f5',
                question: '¿Dónde te imaginas viviendo?',
                options: [
                    { id: 'a', text: 'En mi ciudad natal', score: 6 },
                    { id: 'b', text: 'En una gran ciudad', score: 7 },
                    { id: 'c', text: 'En el campo o una ciudad pequeña', score: 6 },
                    { id: 'd', text: 'Viajando por el mundo', score: 8 }
                ]
            },
            {
                id: 'f6',
                question: '¿Qué tan importante es el.matrimonio para ti?',
                options: [
                    { id: 'a', text: 'Es un paso importante', score: 9 },
                    { id: 'b', text: 'No es necesario pero estaría bien', score: 7 },
                    { id: 'c', text: 'No me interesa', score: 4 },
                    { id: 'd', text: 'Depende de la relación', score: 6 }
                ]
            },
            {
                id: 'f7',
                question: '¿Cómo ahorrarías para el futuro?',
                options: [
                    { id: 'a', text: 'Ahorrando consistentemente', score: 9 },
                    { id: 'b', text: 'Invirtiendo agresivamente', score: 7 },
                    { id: 'c', text: 'Viviendo el momento', score: 4 },
                    { id: 'd', text: 'Buscando un balance', score: 8 }
                ]
            },
            {
                id: 'f8',
                question: '¿Qué valores le transmitirías a tus hijos?',
                options: [
                    { id: 'a', text: 'Respeto y empatía', score: 10 },
                    { id: 'b', text: 'Honestidad y esfuerzo', score: 9 },
                    { id: 'c', text: 'Independencia y curiosidad', score: 8 },
                    { id: 'd', text: 'Felicidad y satisfacción', score: 7 }
                ]
            },
            {
                id: 'f9',
                question: '¿Cómo balancearías vida personal y familiar?',
                options: [
                    { id: 'a', text: 'La familia es prioridad', score: 9 },
                    { id: 'b', text: 'Buscando un equilibrio', score: 10 },
                    { id: 'c', text: 'Depende de las circunstancias', score: 7 },
                    { id: 'd', text: 'Mi carrera también es importante', score: 6 }
                ]
            },
            {
                id: 'f10',
                question: '¿Qué legado te gustaría dejar?',
                options: [
                    { id: 'a', text: 'Una familia feliz y unida', score: 10 },
                    { id: 'b', text: 'Haber impactado positivamente a otros', score: 9 },
                    { id: 'c', text: 'Haber vivido una vida plena', score: 8 },
                    { id: 'd', text: 'Algo creativo o innovador', score: 7 }
                ]
            }
        ]
    },
    {
        id: 'resolucion-conflictos',
        title: 'Resolución de Conflictos',
        description: 'Cómo manejas las situaciones difíciles',
        category: 'Resolución de Conflictos',
        icon: 'Shield',
        questions: [
            {
                id: 'x1',
                question: '¿Qué haces cuando tienes un desacuerdo con tu pareja?',
                options: [
                    { id: 'a', text: 'Busco entender su perspectiva', score: 10 },
                    { id: 'b', text: 'Intento encontrar un compromiso', score: 9 },
                    { id: 'c', text: 'Necesito tiempo para procesar', score: 7 },
                    { id: 'd', text: 'Espero a que pase', score: 3 }
                ]
            },
            {
                id: 'x2',
                question: '¿Cómo reaccionas cuando te critican?',
                options: [
                    { id: 'a', text: 'Escucho y reflexiono', score: 10 },
                    { id: 'b', text: 'Me pongo a la defensiva', score: 4 },
                    { id: 'c', text: 'Pido ejemplos específicos', score: 8 },
                    { id: 'd', text: 'Agradezco la retroalimentación', score: 9 }
                ]
            },
            {
                id: 'x3',
                question: '¿Qué haces cuando te decepcionan?',
                options: [
                    { id: 'a', text: 'Expreso mi decepción directamente', score: 9 },
                    { id: 'b', text: 'Trato de entender las razones', score: 10 },
                    { id: 'c', text: 'Me alejo un tiempo', score: 5 },
                    { id: 'd', text: 'Intento perdonar rápido', score: 7 }
                ]
            },
            {
                id: 'x4',
                question: '¿Cómo manejas la presión en una relación?',
                options: [
                    { id: 'a', text: 'Comunicando mis necesidades', score: 10 },
                    { id: 'b', text: 'Buscando espacio personal', score: 7 },
                    { id: 'c', text: 'Adaptándome a la situación', score: 6 },
                    { id: 'd', text: 'Pidiendo ayuda externa', score: 8 }
                ]
            },
            {
                id: 'x5',
                question: '¿Qué tan paciente eres?',
                options: [
                    { id: 'a', text: 'Muy paciente, espero el momento adecuado', score: 9 },
                    { id: 'b', text: 'Algo paciente pero tengo límites', score: 8 },
                    { id: 'c', text: 'No soy muy paciente', score: 5 },
                    { id: 'd', text: 'Depende de la situación', score: 7 }
                ]
            },
            {
                id: 'x6',
                question: '¿Cómo actúas bajo estrés?',
                options: [
                    { id: 'a', text: 'Mantengo la calma', score: 10 },
                    { id: 'b', text: 'Busco soluciones rápidas', score: 7 },
                    { id: 'c', text: 'Necesito hablar de lo que siento', score: 8 },
                    { id: 'd', text: 'Me enfoco en lo que puedo controlar', score: 9 }
                ]
            },
            {
                id: 'x7',
                question: '¿Qué haces cuando algo te molesta en la relación?',
                options: [
                    { id: 'a', text: 'Lo menciono en el momento', score: 9 },
                    { id: 'b', text: 'Espero a tener más contexto', score: 7 },
                    { id: 'c', text: 'Lo dejo pasar si es menor', score: 5 },
                    { id: 'd', text: 'Escribo lo que siento primero', score: 8 }
                ]
            },
            {
                id: 'x8',
                question: '¿Qué tan flexible eres con los planes?',
                options: [
                    { id: 'a', text: 'Muy flexible, me adapto', score: 8 },
                    { id: 'b', text: 'Algo flexible pero tengo rutinas', score: 7 },
                    { id: 'c', text: 'Prefiero tener planes claros', score: 6 },
                    { id: 'd', text: 'Depende de la situación', score: 7 }
                ]
            },
            {
                id: 'x9',
                question: '¿Cómo reaccionas ante los cambios inesperados?',
                options: [
                    { id: 'a', text: 'Los abrazo como oportunidades', score: 9 },
                    { id: 'b', text: 'Me estreso un poco pero me adapto', score: 7 },
                    { id: 'c', text: 'Necesito tiempo para procesar', score: 6 },
                    { id: 'd', text: 'Prefiero la estabilidad', score: 5 }
                ]
            },
            {
                id: 'x10',
                question: '¿Qué aprendiste de un conflicto pasado?',
                options: [
                    { id: 'a', text: 'A comunicarme mejor', score: 10 },
                    { id: 'b', text: 'A escuchar más', score: 9 },
                    { id: 'c', text: 'A poner límites sanos', score: 8 },
                    { id: 'd', text: 'A no guardar rencor', score: 9 }
                ]
            }
        ]
    },
    {
        id: 'metas-personales',
        title: 'Metas Personales',
        description: 'Tus aspiraciones y lo que quieres lograr',
        category: 'Metas Personales',
        icon: 'Target',
        questions: [
            {
                id: 'm1',
                question: '¿Cuál es tu meta profesional principal?',
                options: [
                    { id: 'a', text: 'Crecer en mi carrera', score: 8 },
                    { id: 'b', text: 'Emprender mi propio negocio', score: 9 },
                    { id: 'c', text: 'Encontrar trabajo con propósito', score: 10 },
                    { id: 'd', text: 'Ganar más dinero', score: 6 }
                ]
            },
            {
                id: 'm2',
                question: '¿Qué tan ambicioso/a eres?',
                options: [
                    { id: 'a', text: 'Muy, siempre busco superarme', score: 9 },
                    { id: 'b', text: 'Algo ambicioso/a pero equilibrado/a', score: 8 },
                    { id: 'c', text: 'Prefiero la estabilidad', score: 6 },
                    { id: 'd', text: 'No me define mi trabajo', score: 7 }
                ]
            },
            {
                id: 'm3',
                question: '¿Qué aprenderías ahora si pudieras?',
                options: [
                    { id: 'a', text: 'Un idioma nuevo', score: 8 },
                    { id: 'b', text: 'Una habilidad técnica', score: 7 },
                    { id: 'c', text: 'Algo artístico', score: 8 },
                    { id: 'd', text: 'Algo para mi crecimiento personal', score: 9 }
                ]
            },
            {
                id: 'm4',
                question: '¿Cómo definirías el éxito?',
                options: [
                    { id: 'a', text: 'Felicidad y salud', score: 10 },
                    { id: 'b', text: 'Lograr mis metas', score: 8 },
                    { id: 'c', text: 'Tener buenas relaciones', score: 9 },
                    { id: 'd', text: 'Contribuir a los demás', score: 9 }
                ]
            },
            {
                id: 'm5',
                question: '¿Qué tan importante es la educación continua?',
                options: [
                    { id: 'a', text: 'Fundamental, siempre hay que aprender', score: 10 },
                    { id: 'b', text: 'Importante cuando es necesario', score: 7 },
                    { id: 'c', text: 'Depende del interés', score: 6 },
                    { id: 'd', text: 'No es prioridad', score: 3 }
                ]
            },
            {
                id: 'm6',
                question: '¿Qué harías si tuvieras tiempo libre infinito?',
                options: [
                    { id: 'a', text: 'Viajar y explorar', score: 9 },
                    { id: 'b', text: 'Crear algo (arte, negocio, etc.)', score: 10 },
                    { id: 'c', text: 'Pasar tiempo con seres queridos', score: 9 },
                    { id: 'd', text: 'Aprender cosas nuevas', score: 8 }
                ]
            },
            {
                id: 'm7',
                question: '¿Qué tan importante es el impacto social?',
                options: [
                    { id: 'a', text: 'Muy importante, quiero cambiar el mundo', score: 9 },
                    { id: 'b', text: 'Importante, ayudo cuando puedo', score: 8 },
                    { id: 'c', text: 'Algo importante', score: 6 },
                    { id: 'd', text: 'No es mi enfoque principal', score: 4 }
                ]
            },
            {
                id: 'm8',
                question: '¿Cómo manejas el fracaso?',
                options: [
                    { id: 'a', text: 'Como una oportunidad de aprender', score: 10 },
                    { id: 'b', text: 'Me frustro pero sigo adelante', score: 7 },
                    { id: 'c', text: 'Analizo qué salió mal', score: 9 },
                    { id: 'd', text: 'A veces me cuesta recuperarme', score: 5 }
                ]
            },
            {
                id: 'm9',
                question: '¿Qué tan importante es el balance vida-trabajo?',
                options: [
                    { id: 'a', text: 'Fundamental para mi bienestar', score: 10 },
                    { id: 'b', text: 'Muy importante', score: 9 },
                    { id: 'c', text: 'A veces sacrifico uno por otro', score: 6 },
                    { id: 'd', text: 'Mi trabajo es mi pasión', score: 7 }
                ]
            },
            {
                id: 'm10',
                question: '¿Qué legado te gustaría dejar?',
                options: [
                    { id: 'a', text: 'Haber ayudado a otros', score: 10 },
                    { id: 'b', text: 'Haber creado algo duradero', score: 9 },
                    { id: 'c', text: 'Haber sido una buena persona', score: 10 },
                    { id: 'd', text: 'Haber vivido plenamente', score: 8 }
                ]
            }
        ]
    },
    {
        id: 'tiempo-libre',
        title: 'Tiempo Libre y Pasatiempos',
        description: 'Cómo te gusta disfrutar tu tiempo libre',
        category: 'Tiempo Libre',
        icon: 'Gamepad2',
        questions: [
            {
                id: 't1',
                question: '¿Qué harías en una tarde libre perfecta?',
                options: [
                    { id: 'a', text: 'Salir a explorar la ciudad', score: 8 },
                    { id: 'b', text: 'Quedarme en casa leyendo o viendo series', score: 7 },
                    { id: 'c', text: 'Hacer ejercicio o deporte', score: 8 },
                    { id: 'd', text: 'Encontrar un lugar nuevo para comer', score: 7 }
                ]
            },
            {
                id: 't2',
                question: '¿Qué tipo de películas prefieres?',
                options: [
                    { id: 'a', text: 'Dramas profundos', score: 8 },
                    { id: 'b', text: 'Comedias ligeras', score: 7 },
                    { id: 'c', text: 'Documentales', score: 8 },
                    { id: 'd', text: 'Acción y aventura', score: 7 }
                ]
            },
            {
                id: 't3',
                question: '¿Qué tipo de música prefieres?',
                options: [
                    { id: 'a', text: 'Pop y música bailable', score: 7 },
                    { id: 'b', text: 'Rock alternativo', score: 8 },
                    { id: 'c', text: 'Música electrónica', score: 7 },
                    { id: 'd', text: 'Depende del mood', score: 8 }
                ]
            },
            {
                id: 't4',
                question: '¿Qué tipo de vacaciones prefieres?',
                options: [
                    { id: 'a', text: 'Aventura y naturaleza', score: 9 },
                    { id: 'b', text: 'Playa y relajación', score: 7 },
                    { id: 'c', text: 'Cultura y ciudades', score: 8 },
                    { id: 'd', text: 'Road trip', score: 8 }
                ]
            },
            {
                id: 't5',
                question: '¿Qué tipo de comida prefieres?',
                options: [
                    { id: 'a', text: 'Comida casera', score: 8 },
                    { id: 'b', text: 'Restaurantes étnicos', score: 8 },
                    { id: 'c', text: 'Comida rápida', score: 5 },
                    { id: 'd', text: 'Sana y nutritiva', score: 7 }
                ]
            },
            {
                id: 't6',
                question: '¿Qué prefieres para una cita?',
                options: [
                    { id: 'a', text: 'Cena en un restaurante', score: 8 },
                    { id: 'b', text: 'Actividad al aire libre', score: 9 },
                    { id: 'c', text: 'Ir a un evento cultural', score: 8 },
                    { id: 'd', text: 'Algo casual como un café', score: 7 }
                ]
            },
            {
                id: 't7',
                question: '¿Qué tan social eres?',
                options: [
                    { id: 'a', text: 'Muy social, me encanta estar con gente', score: 8 },
                    { id: 'b', text: 'Social pero necesito tiempo solo', score: 8 },
                    { id: 'c', text: 'Prefiero quedarme con unos pocos amigos', score: 7 },
                    { id: 'd', text: 'Introvertido/a pero disfruto salidas', score: 6 }
                ]
            },
            {
                id: 't8',
                question: '¿Qué tipo de ejercicio prefieres?',
                options: [
                    { id: 'a', text: 'Gym o entrenamiento intenso', score: 7 },
                    { id: 'b', text: 'Yoga o pilates', score: 7 },
                    { id: 'c', text: 'Deportes en equipo', score: 8 },
                    { id: 'd', text: 'Caminar o correr', score: 7 }
                ]
            },
            {
                id: 't9',
                question: '¿Qué tipo de lectura prefieres?',
                options: [
                    { id: 'a', text: 'Ficción y novelas', score: 8 },
                    { id: 'b', text: 'No ficción y autoayuda', score: 7 },
                    { id: 'c', text: 'Ciencia ficción o fantasía', score: 8 },
                    { id: 'd', text: 'No leo mucho', score: 4 }
                ]
            },
            {
                id: 't10',
                question: '¿Qué harías juntos en un fin de semana?',
                options: [
                    { id: 'a', text: 'Explorar un lugar nuevo', score: 9 },
                    { id: 'b', text: 'Cocinar algo especial', score: 8 },
                    { id: 'c', text: 'Ver una maratón de series', score: 6 },
                    { id: 'd', text: 'Invitar a amigos', score: 7 }
                ]
            }
        ]
    },
    {
        id: 'compatibilidad-emocional',
        title: 'Compatibilidad Emocional',
        description: 'Cómo conectas emocionalmente con otros',
        category: 'Compatibilidad Emocional',
        icon: 'Brain',
        questions: [
            {
                id: 'e1',
                question: '¿Qué tan empático/a eres?',
                options: [
                    { id: 'a', text: 'Muy, siento lo que sienten otros', score: 10 },
                    { id: 'b', text: 'Algo empático/a', score: 7 },
                    { id: 'c', text: 'Intento entender pero no siempre puedo', score: 6 },
                    { id: 'd', text: 'Soy más lógico/a que emocional', score: 5 }
                ]
            },
            {
                id: 'e2',
                question: '¿Cómo manejas tus propias emociones?',
                options: [
                    { id: 'a', text: 'Las expreso abiertamente', score: 8 },
                    { id: 'b', text: 'Las proceso internamente', score: 7 },
                    { id: 'c', text: 'Hablo con alguien de confianza', score: 9 },
                    { id: 'd', text: 'A veces me cuesta identificarlas', score: 4 }
                ]
            },
            {
                id: 'e3',
                question: '¿Qué tan vulnerable eres en una relación?',
                options: [
                    { id: 'a', text: 'Muy, me abro completamente', score: 9 },
                    { id: 'b', text: 'Gradualmente, con confianza', score: 10 },
                    { id: 'c', text: 'Cuido mucho a quién me abro', score: 7 },
                    { id: 'd', text: 'Prefiero mantener cierta distancia', score: 4 }
                ]
            },
            {
                id: 'e4',
                question: '¿Qué tipo de conexión buscas?',
                options: [
                    { id: 'a', text: 'Emocional profunda', score: 10 },
                    { id: 'b', text: 'Intelectual estimulante', score: 8 },
                    { id: 'c', text: 'Divertida y ligera', score: 6 },
                    { id: 'd', text: 'Espiritual', score: 7 }
                ]
            },
            {
                id: 'e5',
                question: '¿Qué haces cuando tu pareja está pasando por un mal momento?',
                options: [
                    { id: 'a', text: 'Escucho sin juzgar', score: 10 },
                    { id: 'b', text: 'Ofrezco soluciones', score: 6 },
                    { id: 'c', text: 'Le doy espacio pero estoy presente', score: 8 },
                    { id: 'd', text: 'Intento animarlo/a con acción', score: 7 }
                ]
            },
            {
                id: 'e6',
                question: '¿Qué tan importante es la conexión espiritual?',
                options: [
                    { id: 'a', text: 'Muy importante', score: 8 },
                    { id: 'b', text: 'Algo importante', score: 6 },
                    { id: 'c', text: 'No me interesa mucho', score: 4 },
                    { id: 'd', text: 'Depende de la definición', score: 6 }
                ]
            },
            {
                id: 'e7',
                question: '¿Cómo expresas gratitud?',
                options: [
                    { id: 'a', text: 'Con palabras frecuentemente', score: 9 },
                    { id: 'b', text: 'Con acciones', score: 8 },
                    { id: 'c', text: 'A veces me olvido pero lo siento', score: 5 },
                    { id: 'd', text: 'Con detalles especiales', score: 8 }
                ]
            },
            {
                id: 'e8',
                question: '¿Qué tan importante es la validación emocional?',
                options: [
                    { id: 'a', text: 'Fundamental para mí', score: 10 },
                    { id: 'b', text: 'Muy importante', score: 9 },
                    { id: 'c', text: 'Algo importante', score: 6 },
                    { id: 'd', text: 'No tanto, prefiero soluciones', score: 4 }
                ]
            },
            {
                id: 'e9',
                question: '¿Cómo manejas la soledad?',
                options: [
                    { id: 'a', text: 'La disfruto como tiempo para mí', score: 8 },
                    { id: 'b', text: 'A veces es difícil', score: 6 },
                    { id: 'c', text: 'Busco compañía rápido', score: 5 },
                    { id: 'd', text: 'La uso para reflexionar', score: 8 }
                ]
            },
            {
                id: 'e10',
                question: '¿Qué significa "estar en sintonía" para ti?',
                options: [
                    { id: 'a', text: 'Entenderse sin palabras', score: 10 },
                    { id: 'b', text: 'Sentir lo mismo al mismo tiempo', score: 8 },
                    { id: 'c', text: 'Apoyarse mutuamente incondicionalmente', score: 9 },
                    { id: 'd', text: 'Crecer juntos como personas', score: 9 }
                ]
            }
        ]
    }
];

/**
 * Calculate quiz score from answers
 */
export function calculateQuizScore(quizId: string, answers: Record<string, string>): number {
    const quiz = COMPATIBILITY_QUIZZES.find(q => q.id === quizId);
    if (!quiz) return 0;

    let total = 0;
    let maxPossible = 0;

    for (const question of quiz.questions) {
        const answerId = answers[question.id];
        const option = question.options.find(o => o.id === answerId);
        if (option) {
            total += option.score;
        }
        maxPossible += 10; // Max score per question is 10
    }

    return maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
}

/**
 * Determine archetype based on quiz score
 */
export function determineArchetype(quizId: string, score: number): string {
    if (score >= 80) return 'profundo';
    if (score >= 60) return 'equilibrado';
    if (score >= 40) return 'social';
    return 'explorador';
}

export interface ArchetypeInfo {
    name: string;
    description: string;
    strengths: string[];
    risks: string[];
    idealPartner: string[];
    perception: string;
}

export const ARCHETYPES: Record<string, ArchetypeInfo> = {
    profundo: {
        name: 'Profundo',
        description: 'Buscas conexiones significativas y valoras la profundidad emocional sobre la superficialidad. Para ti, una buena relación se construye sobre la confianza y la vulnerabilidad mutua.',
        strengths: ['Empático', 'Introspectivo', 'Leal', 'Observador'],
        risks: ['Puede ser demasiado intenso al inicio', 'Toma tiempo en abrirse', 'Evita la superficialidad'],
        idealPartner: ['Equilibrado', 'Social'],
        perception: 'Tu círculo te describe como alguien en quien se puede confiar. Profundo, serio cuando importa, pero con un humor sutil que solo conocen los cercanos.',
    },
    equilibrado: {
        name: 'Equilibrado',
        description: 'Tienes una mezcla sana de profundidad y diversión. Te adaptas a diferentes situaciones y personas, y valoras tanto la estabilidad como la espontaneidad.',
        strengths: ['Adaptable', 'Estable', 'Buen comunicador', 'Paciente'],
        risks: ['Puede parecer indeciso', 'A veces evita conflictos', 'Puede sacrificar sus necesidades'],
        idealPartner: ['Profundo', 'Explorador'],
        perception: 'Eres la persona que todos quieren en su grupo. Equilibrado, confiable, siempre con la actitud correcta. Un roble flexible.',
    },
    social: {
        name: 'Social',
        description: 'Energías altas, amas la gente y las experiencias compartidas. Las mejores memorias de tu vida son con otros.',
        strengths: ['Carismático', 'Empático', 'Espontáneo', 'Optimista'],
        risks: ['Puede aburrirse de rutinas', 'A veces habla más de lo que escucha', 'Necesita estímulo constante'],
        idealPartner: ['Profundo', 'Equilibrado'],
        perception: 'Eres la vida de la fiesta, pero también el amigo que llama solo para ver cómo estás. Social y genuino.',
    },
    explorador: {
        name: 'Explorador',
        description: 'Curioso por naturaleza, siempre buscando nuevas experiencias, ideas y personas que expandan tu mundo.',
        strengths: ['Curioso', 'Flexible', 'Creativo', 'Independiente'],
        risks: ['Evita compromisos rápidos', 'Puede aburrirse de rutinas', 'Difícil de conocer profundamente'],
        idealPartner: ['Equilibrado', 'Profundo'],
        perception: 'Siempre tienes una historia que contar. Explorador de vida, curioso de mente, libre de espíritu.',
    },
};
