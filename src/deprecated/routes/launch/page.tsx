/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
import React from 'react';
import Link from 'next/link';
import { Shield, Heart, Zap } from 'lucide-react';

export default function LaunchPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white font-sans">
            <header className="container mx-auto px-6 py-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Alora</h1>
                <nav className="space-x-4">
                    <a href="#features" className="hover:text-pink-300 transition">Features</a>
                    <a href="#safety" className="hover:text-pink-300 transition">Safety</a>
                    <Link href="/login" className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition">Login</Link>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-12 text-center md:text-left">
                <div className="md:flex items-center justify-between">
                    <div className="md:w-1/2 space-y-6">
                        <span className="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm font-semibold mb-2">
                            v1.0.0 Global Launch 🚀
                        </span>
                        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
                            Dating with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                Compatibilidad Inteligente
                            </span>
                        </h2>
                        <p className="text-lg text-gray-300 max-w-lg">
                            Alora encuentra conexiones que importan. Seguro, justo y diseñado para momentos humanos reales.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-900 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                                Crear Cuenta Gratis
                            </Link>
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600/50 text-white rounded-full font-bold hover:bg-indigo-600/70 transition border border-indigo-500/30">
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>

                    <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center relative">
                        <div className="absolute inset-0 bg-pink-500 blur-[100px] opacity-20 rounded-full"></div>
                        <div className="relative z-10 w-64 h-[500px] bg-black border-4 border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-center">
                            <p className="text-gray-500">App Screenshot Here</p>
                        </div>
                    </div>
                </div>

                <section id="features" className="mt-24 grid md:grid-cols-3 gap-8">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Heart className="w-10 h-10 text-pink-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Score de Compatibilidad</h3>
                        <p className="text-gray-400">Análisis de compatibilidad basado en valores, intereses y personalidad.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Shield className="w-10 h-10 text-green-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Safety First</h3>
                        <p className="text-gray-400">Perfiles verificados, anti-acoso y privacidad estricta.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Zap className="w-10 h-10 text-yellow-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Conexiones Reales</h3>
                        <p className="text-gray-400">Voice intros, icebreakers y compatibilidad para conversaciones significativas.</p>
                    </div>
                </section>
            </main>

            <footer className="container mx-auto px-6 py-8 mt-12 border-t border-white/10 text-center text-gray-500 text-sm">
                <p>&copy; 2026 Alora Inc. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="/privacy" className="hover:text-white">Privacidad</a>
                    <a href="/terms" className="hover:text-white">Términos</a>
                </div>
            </footer>
        </div>
    );
}

