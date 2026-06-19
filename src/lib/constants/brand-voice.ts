export const BRAND_VOICE = {
    pillars: {
        security: 'Tu espacio seguro. Cada interacción está protegida.',
        curiosity: 'Cada persona tiene una historia que merece ser descubierta.',
        optimism: 'Creemos que las conexiones auténticas transforman vidas.',
    },

    states: {
        emptyFeed: {
            title: 'Buscando perfiles nuevos para ti',
            subtitle: 'Vuelve pronto, siempre hay gente nueva en Alora.',
        },
        noMatches: {
            title: 'Aún no has encontrado a alguien',
            subtitle: 'Completar tu perfil aumenta tus posibilidades de conectar.',
        },
        noMessages: {
            title: 'Envía el primer mensaje',
            subtitle: '¡Hola! Tu match te está esperando.',
        },
        errorGeneric: {
            title: 'Algo salió mal',
            subtitle: 'Intenta de nuevo en unos segundos.',
        },
        offline: {
            title: 'Sin conexión',
            subtitle: 'Tus mensajes se enviarán cuando vuelvas a estar en línea.',
        },
        discoverExhausted: {
            title: 'Viste todos los perfiles por ahora',
            subtitle: 'Vuelve pronto, siempre hay nuevas personas.',
        },
    },

    nudges: {
        newMatch: '¡Es un Match!',
        firstMessageWoman: 'Escribe algo que lo haga sonreír.',
        firstMessageMan: 'Espera a que la otra persona esté lista.',
        inactivity: 'Parece que se enfrió. ¿Un mensaje nuevo?',
        typing: 'escribiendo...',
        online: 'En línea',
        lastSeen: 'Última vez reciente',
    },

    safety: {
        blockConfirm: 'Has bloqueado a este usuario. No volverán a verse en Alora.',
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
        step4: 'Tus colores',
        completion: 'Tu perfil está listo. Hora de conocer personas increíbles.',
        skip: 'Lo haré más tarde',
        encouragement: 'Cada paso acerca una conexión auténtica.',
    },
};

export const EMOTIONAL_COPY = {
    matchCreated: 'Dos personas que se encontraron. ¿Qué historia van a escribir?',
    firstMessage: 'El primer mensaje es el más valiente. Adelante.',
    icebreaker: 'A veces solo hace falta un "hola" con personalidad.',
    profileComplete: 'Tu perfil brilla. Así te verán los demás.',
    verificationCta: 'Muéstrale al mundo que eres real. La confianza empieza aquí.',
    reportConfirm: 'Has hecho lo correcto. Tu acción ayuda a toda la comunidad.',
    blockConfirm: 'Tu paz mental es lo primero. Este usuario ya no está en tu camino.',
};
