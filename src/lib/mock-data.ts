

import type { ChatMessage } from './actions';
import placeholderImages from './placeholder-images.json';


export const lifestyleOptions = {
    smoking: ['No fumo', 'Fumo socialmente', 'Fumo regularmente', 'Prefiero no decirlo'],
    drinking: ['No bebo', 'Bebo socialmente', 'Bebo regularmente', 'Prefiero no decirlo'],
    religion: ['Agnóstico/a', 'Ateo/a', 'Budista', 'Cristiano/a', 'Hindú', 'Judío/a', 'Musulmán/a', 'Espiritual pero no religioso/a', 'Otro', 'Prefiero no decirlo'],
    children: ['No tengo y no quiero', 'No tengo y quiero', 'No tengo y no sé', 'Tengo y quiero más', 'Tengo y no quiero más', 'Prefiero no decirlo'],
};

export const zodiacSigns = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
export const educationLevels = ['Secundaria', 'Bachillerato', 'Formación Profesional', 'Grado Universitario', 'Máster', 'Doctorado', 'Prefiero no decirlo'];

export const allMusicGenres = ['Indie', 'Rock Alternativo', 'Pop', 'Electrónica', 'Hip Hop', 'R&B', 'Reggaeton', 'Clásica', 'Jazz', 'Folk', 'Metal', 'Techno', 'House', 'Bandas sonoras', 'Música de los 80', 'Música de los 90'];

export const allPersonalGuideOptions: PersonalGuideItem[] = [
    { title: 'Toma la iniciativa', description: 'Me cuesta un poco empezar las conversaciones. ¡Agradecería que dieras el primer paso!' },
    { title: 'Respuestas lentas', description: 'A veces tardo en responder, pero no es nada personal. ¡Te contestaré en cuanto pueda!' },
    { title: 'Audios bienvenidos', description: 'Me encantan los audios cortos para conocernos mejor.' },
    { title: 'Humor ante todo', description: 'Disfruto de las conversaciones ligeras y con mucho humor.' },
    { title: 'Preguntas profundas', description: 'Me gusta ir más allá de la superficie. ¡Pregúntame lo que quieras!' },
    { title: 'Emojis y GIFs', description: '¡No te cortes con los emojis y los GIFs! Me ayudan a entender el tono.' },
];

export const icebreakers = {
    "Divertidas y Ligeras": [
        "Si pudieras tener cualquier superpoder, ¿cuál sería y por qué?",
        "¿Cuál es el emoji que más te representa ahora mismo?",
        "Si los animales pudieran hablar, ¿cuál sería el más grosero?",
        "¿Cuál es la cosa más rara que has comido por gusto?",
    ],
    "Para Conectar": [
        "¿Qué es algo que te apasione de verdad y de lo que podrías hablar horas?",
        "¿Cuál es el mejor consejo que te han dado?",
        "¿Qué es algo que la gente suele malinterpretar de ti?",
        "Si pudieras cenar con tres personas (vivas o muertas), ¿a quiénes elegirías?",
    ],
    "Sobre Viajes y Aventuras": [
        "¿Cuál es el viaje más memorable que has hecho?",
        "Si tuvieras que mudarte a otro país mañana, ¿a dónde irías?",
        "Playa, montaña o ciudad: ¿qué escapada prefieres para un fin de semana?",
        "¿Cuál es la aventura más espontánea que has vivido?",
    ],
};

export interface PersonalGuideItem {
    title: string;
    description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'non-binary';
  city: string;
  photos: string[];
  interests: string[];
  values: string[];
  musicGenres: string[];
  status: string;
  isVerified: boolean;
  compatibility: number;
  bio: string;
  zodiacSign?: string;
  education?: string;
  smoking?: string;
  drinking?: string;
  children?: string;
  religion?: string;
  seeking?: 'women' | 'men' | 'all';
  personalGuide?: PersonalGuideItem[];
}

export const mockProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Sofía',
    age: 28,
    gender: 'woman',
    city: 'Madrid, España',
    photos: [
        placeholderImages.sofia1, 
        placeholderImages.sofia2,
        placeholderImages.sofia3,
    ],
    interests: ['Yoga', 'Arte', 'Viajar', 'Cocina vegetariana', 'Cine de autor'],
    values: ['Honestidad', 'Amabilidad', 'Crecimiento', 'Aventura', 'Respeto'],
    musicGenres: ['Indie', 'Folk', 'Electrónica'],
    status: 'Buscando algo serio y bonito',
    isVerified: true,
    compatibility: 92,
    bio: 'Amante del yoga y los viajes. Siempre estoy buscando la próxima aventura o un nuevo libro para leer.\n\nMe encanta explorar galerías de arte y probar nuevas recetas vegetarianas. Busco a alguien con quien compartir risas y conversaciones profundas.',
    zodiacSign: 'Libra',
    education: 'Máster',
    smoking: 'No fumo',
    drinking: 'Bebo socialmente',
    children: 'No tengo y quiero',
    religion: 'Espiritual pero no religioso/a',
    personalGuide: [
        { title: 'Toma la iniciativa', description: 'Me cuesta un poco empezar las conversaciones. ¡Agradecería que dieras el primer paso!' },
        { title: 'Preguntas profundas', description: 'Me gusta ir más allá de la superficie. ¡Pregúntame lo que quieras!' },
    ]
  },
  {
    id: '2',
    name: 'Elena',
    age: 31,
    gender: 'woman',
    city: 'Barcelona, España',
    photos: [
        placeholderImages.elena1,
        placeholderImages.elena2,
    ],
    interests: ['Leer', 'Senderismo', 'Fotografía', 'Juegos de mesa', 'Documentales'],
    values: ['Aventura', 'Lealtad', 'Humor', 'Curiosidad', 'Intelecto'],
    musicGenres: ['Rock Alternativo', 'Música de los 90', 'Bandas sonoras'],
    status: 'Abierta a conocer gente nueva',
    isVerified: true,
    compatibility: 88,
    bio: 'Ingeniera de día, exploradora de montañas los fines de semana. Mi perro y yo somos un paquete.\n\nMe encontrarás con un libro en la mano o planeando la próxima ruta de senderismo. Disfruto de una buena conversación y una noche de juegos de mesa.',
    zodiacSign: 'Sagitario',
    education: 'Grado Universitario',
    smoking: 'No fumo',
    drinking: 'No bebo',
    children: 'No tengo y no sé',
  },
  {
    id: '3',
    name: 'Camila',
    age: 26,
    gender: 'woman',
    city: 'Valencia, España',
    photos: [
        placeholderImages.camila1,
        placeholderImages.camila2,
        placeholderImages.camila3,
        placeholderImages.camila4,
    ],
    interests: ['Música', 'Cocinar', 'Bailar', 'Conciertos', 'Moda'],
    values: ['Familia', 'Creatividad', 'Respeto', 'Espontaneidad', 'Alegría'],
    musicGenres: ['Pop', 'Reggaeton', 'R&B'],
    status: 'Veamos a dónde nos lleva la vida',
    isVerified: true,
    compatibility: 85,
    bio: 'La música es mi lenguaje de amor. Me encanta bailar, ir a conciertos y descubrir nuevos artistas.\n\nSoy sociable y creativa, y siempre estoy buscando nuevas formas de expresarme. Si puedes seguirme el ritmo en la pista de baile, ya tienes puntos extra.',
    zodiacSign: 'Leo',
    drinking: 'Bebo socialmente',
    personalGuide: [
        { title: 'Humor ante todo', description: 'Disfruto de las conversaciones ligeras y con mucho humor.' },
        { title: 'Audios bienvenidos', description: 'Me encantan los audios cortos para conocernos mejor.' },
    ]
  },
  {
    id: '4',
    name: 'Isabella',
    age: 29,
    gender: 'woman',
    city: 'Sevilla, España',
    photos: [
        placeholderImages.isabella1,
        placeholderImages.isabella2,
    ],
    interests: ['Cine', 'Fitness', 'Podcasts', 'Tecnología', 'Astrología'],
    values: ['Ambición', 'Autenticidad', 'Empatía', 'Disciplina', 'Crecimiento'],
    musicGenres: ['Techno', 'House', 'Hip Hop'],
    status: 'Enfocada en mi carrera, pero abierta a una conexión especial',
    isVerified: true,
    compatibility: 90,
    bio: 'Emprendedora con una pasión por el fitness y la tecnología. Me encanta empezar el día con un buen entrenamiento y un podcast interesante.\n\nSoy ambiciosa y busco a alguien que me inspire y a quien yo pueda inspirar. También me gusta hablar de signos zodiacales.',
    zodiacSign: 'Acuario',
    education: 'Doctorado',
    smoking: 'No fumo',
    drinking: 'Bebo socialmente',
    children: 'No tengo y no quiero',
  },
  {
    id: '5',
    name: 'Javier',
    age: 32,
    gender: 'man',
    city: 'Madrid, España',
    photos: [
        placeholderImages.javier1,
        placeholderImages.javier2,
    ],
    interests: ['Deportes', 'Videojuegos', 'Cerveza artesanal', 'Stand-up comedy', 'Inversiones'],
    values: ['Lealtad', 'Humor', 'Compañerismo', 'Ambición', 'Honestidad'],
    musicGenres: ['Rock Alternativo', 'Hip Hop', 'Música de los 80'],
    status: 'Buscando una compañera de aventuras',
    isVerified: true,
    compatibility: 87,
    bio: 'Un tipo tranquilo al que le gusta el buen fútbol, una partida de consola y descubrir cervezas nuevas. Si te ríes con mis chistes malos, ya tenemos mucho ganado.',
    zodiacSign: 'Tauro',
    education: 'Grado Universitario',
    smoking: 'Fumo socialmente',
    drinking: 'Bebo socialmente',
    children: 'No tengo y no sé',
    religion: 'Ateo/a',
  },
  {
    id: '6',
    name: 'Alex',
    age: 27,
    gender: 'non-binary',
    city: 'Bilbao, España',
    photos: [
        placeholderImages.alex1,
        placeholderImages.alex2,
    ],
    interests: ['Arte', 'Feminismo', 'Decoración', 'Plantas', 'Gatos'],
    values: ['Creatividad', 'Respeto', 'Autenticidad', 'Vulnerabilidad', 'Justicia Social'],
    musicGenres: ['Indie', 'Electrónica', 'Folk'],
    status: 'Creando y deconstruyendo',
    isVerified: true,
    compatibility: 91,
    bio: 'Artista y amante de los gatos. Mi casa es una jungla urbana y estoy feliz con ello. Busco conexiones reales con gente que no tenga miedo a ser diferente y a cuestionar las normas.',
    zodiacSign: 'Piscis',
    education: 'Formación Profesional',
    smoking: 'No fumo',
    drinking: 'No bebo',
    children: 'No tengo y no quiero',
    religion: 'Agnóstico/a',
  },
];

export const mockUser: UserProfile = {
  id: 'me',
  name: 'Valentina',
  age: 29,
  gender: 'woman',
  seeking: 'all',
  city: 'Madrid, España',
  photos: [
      placeholderImages.valentina1,
      placeholderImages.valentina2,
      placeholderImages.valentina3,
  ],
  interests: ['Diseño', 'Leer', 'Gatos', 'Café de especialidad', 'Plantas'],
  values: ['Autenticidad', 'Crecimiento', 'Respeto', 'Creatividad', 'Independencia'],
  musicGenres: ['Indie', 'Música de los 80', 'Jazz'],
  status: 'Conociendo gente nueva',
  isVerified: true,
  compatibility: 0,
  bio: 'Diseñadora gráfica con una debilidad por los gatos y el buen café.\n\nMe encanta pasar las tardes leyendo en mi rincón verde rodeada de plantas. Busco una conexión genuina con alguien que aprecie las pequeñas cosas de la vida y tenga buen tema de conversación.',
  zodiacSign: 'Piscis',
  education: 'Grado Universitario',
  smoking: 'No fumo',
  drinking: 'Bebo socialmente',
  children: 'No tengo y no sé',
  religion: 'Agnóstico/a',
  personalGuide: [
      allPersonalGuideOptions[0],
      allPersonalGuideOptions[1],
  ]
}

export interface ChatConversation {
  id: string;
  participant: UserProfile;
  messages: ChatMessage[];
}

export const mockChats: ChatConversation[] = [
    {
        id: '1',
        participant: mockProfiles.find(p => p.id === '1')!,
        messages: [
            { id: 'msg1', sender: 'them', text: '¡Hola! Vi que a ambas nos encanta el Yoga. ¿Qué estilo practicas?', timestamp: '2024-05-21T10:00:00Z' },
            { id: 'msg2', sender: 'me', text: '¡Hola Sofía! Principalmente hago Vinyasa. ¿Y tú?', timestamp: '2024-05-21T10:05:00Z' },
        ]
    },
    {
        id: '2',
        participant: mockProfiles.find(p => p.id === '2')!,
        messages: [
            { id: 'msg3', sender: 'them', text: '¡Tus fotos de senderismo son increíbles! ¿Alguna recomendación?', timestamp: '2024-05-20T15:30:00Z' },
        ]
    },
     {
        id: '3',
        participant: mockProfiles.find(p => p.id === '3')!,
        messages: []
    }
]

export const allInterests = [
    // Hobbies y Creatividad
    'Fotografía', 'Dibujo', 'Pintura', 'Escritura', 'Bailar', 'Cantar', 'Tocar un instrumento', 'Cocinar', 'Repostería', 'Jardinería', 'Manualidades', 'Diseño gráfico', 'Decoración', 'Moda',
    // Deportes y Fitness
    'Senderismo', 'Running', 'Yoga', 'Gimnasio', 'Crossfit', 'Ciclismo', 'Natación', 'Escalada', 'Artes marciales', 'Pilates', 'Fútbol', 'Baloncesto', 'Tenis', 'Pádel', 'Esquí', 'Snowboard', 'Surf',
    // Cultura y Conocimiento
    'Leer', 'Cine', 'Series', 'Documentales', 'Teatro', 'Museos', 'Arte', 'Historia', 'Ciencia', 'Tecnología', 'Filosofía', 'Psicología', 'Aprender idiomas', 'Podcasts', 'Astrología',
    // Social y Ocio
    'Viajar', 'Conciertos', 'Festivales', 'Juegos de mesa', 'Videojuegos', 'Stand-up comedy', 'Brunch', 'Café de especialidad', 'Cerveza artesanal', 'Vino', 'Salir de fiesta', 'Voluntariado',
    // Estilo de vida y Bienestar
    'Mindfulness', 'Meditación', 'Crecimiento personal', 'Sostenibilidad', 'Minimalismo', 'Feminismo', 'Activismo LGTBIQ+', 'Política', 'Cuidado de la piel', 'Mascotas', 'Gatos', 'Perros', 'Plantas'
];


export const allValues = ['Honestidad', 'Amabilidad', 'Crecimiento', 'Lealtad', 'Humor', 'Aventura', 'Familia', 'Creatividad', 'Respeto', 'Ambición', 'Autenticidad', 'Empatía', 'Curiosidad', 'Intelecto', 'Espontaneidad', 'Alegría', 'Disciplina', 'Independencia', 'Comunicación', 'Compañerismo', 'Pasión', 'Vulnerabilidad', 'Paciencia', 'Optimismo', 'Generosidad', 'Justicia Social'];

    
