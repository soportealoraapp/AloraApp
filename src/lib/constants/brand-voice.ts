export const BRAND_VOICE = {
    pillars: {
        security: "Protección y calma en cada interacción.",
        curiosity: "Interés genuino por el otro.",
        optimism: "La creencia de que cada conexión puede ser especial."
    },

    // Copy for different user states
    states: {
        emptyFeed: {
            title: "Buscando algo especial para ti",
            subtitle: "Estamos refinando los perfiles para asegurar que cada conexión valga la pena. Vuelve en un momento."
        },
        noMatches: {
            title: "Tu historia está por comenzar",
            subtitle: "Cada gran conexión comienza con un poco de paciencia. Mientras tanto, ¿por qué no completas tu perfil?"
        },
        errorGeneric: {
            title: "Un pequeño tropiezo",
            subtitle: "Incluso las mejores historias tienen pausas. Estamos trabajando para que todo vuelva a fluir."
        }
    },

    // Conversation Nudges
    nudges: {
        newMatch: "¡Es un Match! La curiosidad es el primer paso.",
        firstMessageWoman: "Tienes el primer paso. ¿Qué te gustaría descubrir sobre él?",
        inactivity: "Esta conexión parece estar en pausa. Siempre puedes saludar de nuevo cuando estés listo."
    },

    // Empathetic Safety
    safety: {
        blockConfirm: "Hemos guardado tu espacio. No volverás a ver este perfil.",
        reportThankYou: "Gracias por ayudarnos a cuidar Alora. Tu seguridad es nuestro motor."
    }
};
