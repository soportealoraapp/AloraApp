export const BRAND_VOICE = {
    pillars: {
        security: 'Tu espacio seguro. Cada interacción está protegida.',
        curiosity: 'Cada persona tiene una historia que merece ser descubierta.',
        optimism: 'Creemos que las conexiones auténticas transforman vidas.',
    },

    states: {
        emptyFeed: {
            title: 'Buscando algo especial para ti',
            subtitle: 'Estamos refinando los perfiles para asegurar que cada conexión valga la pena. Vuelve en un momento.',
        },
        noMatches: {
            title: 'Tu historia está por comenzar',
            subtitle: 'Cada gran conexión comienza con un poco de paciencia. Mientras tanto, ¿por qué no completas tu perfil?',
        },
        noMessages: {
            title: 'Silencio que invita',
            subtitle: 'Todo match comienza con un primer mensaje. ¿Te animas?',
        },
        errorGeneric: {
            title: 'Un pequeño tropiezo',
            subtitle: 'Incluso las mejores historias tienen pausas. Estamos trabajando para que todo vuelva a fluir.',
        },
        offline: {
            title: 'Sin conexión',
            subtitle: 'No te preocupes, tus mensajes se guardarán y se enviarán cuando vuelvas a estar en línea.',
        },
        discoverExhausted: {
            title: 'Has visto todos los perfiles',
            subtitle: 'Vuelve pronto, siempre hay nuevas personas listas para conocerte.',
        },
    },

    nudges: {
        newMatch: '¡Es un Match! La curiosidad es el primer paso.',
        firstMessageWoman: 'Tienes el primer paso. ¿Qué te gustaría descubrir sobre él?',
        firstMessageMan: 'Ella dará el primer paso cuando se sienta lista. Mientras tanto, completa tu perfil.',
        inactivity: 'Esta conexión parece estar en pausa. Siempre puedes saludar de nuevo cuando estés lista.',
        typing: 'está escribiendo...',
        online: 'En línea ahora',
        lastSeen: 'Visto recientemente',
    },

    safety: {
        blockConfirm: 'Has bloqueado a este usuario. No volveréis a veros en Alora.',
        reportThankYou: 'Gracias por ayudarnos a mantener Alora segura. Revisaremos tu reporte en 24-48 horas.',
        reportAnonymous: 'Tu reporte es completamente anónimo.',
        verificationPending: 'Tu verificación está en revisión. Te notificaremos cuando esté lista.',
        verificationApproved: '¡Identidad verificada! Ahora tienes el badge azul en tu perfil.',
        verificationRejected: 'No pudimos verificar tu identidad. Intenta de nuevo con una selfie más clara.',
        muteConfirm: 'Has silenciado esta conversación. No recibirás notificaciones.',
    },

    onboarding: {
        welcome: 'Bienvenida a Alora',
        step1: 'Cuéntanos quién eres',
        step2: '¿Qué te hace vibrar?',
        step3: 'Muéstranos tu mundo',
        step4: 'Protege tu espacio',
        completion: 'Tu perfil está listo. Hora de conocer personas increíbles.',
        skip: 'Lo haré más tarde',
        encouragement: 'Cada paso acerca una conexión auténtica.',
    },
};

export const EMOTIONAL_COPY = {
    matchCreated: 'Dos almas que se encontraron. ¿Qué historia van a escribir?',
    firstMessage: 'El primer mensaje es el más valiente. Adelante.',
    icebreaker: 'A veces solo hace falta un "hola" con personalidad.',
    profileComplete: 'Tu perfil brilla. Así te verán los demás.',
    verificationCta: 'Muéstrale al mundo que eres real. La confianza empieza aquí.',
    reportConfirm: 'Has hecho lo correcto. Tu acción ayuda a toda la comunidad.',
    blockConfirm: 'Tu paz mental es lo primero. Este usuario ya no está en tu camino.',
};
