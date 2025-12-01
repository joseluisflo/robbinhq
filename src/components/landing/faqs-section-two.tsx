
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQs() {
    const faqItems = [
        {
            id: 'item-1',
            question: '¿Qué es AgentVerse?',
            answer: 'AgentVerse es una plataforma que te permite crear, entrenar y desplegar agentes de inteligencia artificial para tu negocio. Estos agentes pueden automatizar el soporte al cliente, responder preguntas y realizar tareas en diferentes canales como chat, correo electrónico y teléfono.',
        },
        {
            id: 'item-2',
            question: '¿Qué son los "créditos" y cómo se utilizan?',
            answer: 'Los créditos se utilizan para las interacciones con la IA. Cada vez que el agente responde a una pregunta o ejecuta una tarea compleja, se consume una cantidad determinada de créditos. Tu plan mensual incluye una cantidad de créditos que se renueva cada mes.',
        },
        {
            id: 'item-3',
            question: '¿Qué pasa si me quedo sin créditos?',
            answer: 'Si agotas tus créditos mensuales, tus agentes dejarán de responder hasta que se renueve tu plan o hasta que actualices a un plan superior con más créditos.',
        },
        {
            id: 'item-4',
            question: '¿Mis datos están seguros?',
            answer: "La seguridad es nuestra máxima prioridad. Todos tus datos se almacenan de forma segura y tienes control total sobre ellos, incluyendo políticas de retención y la opción de anonimizar la información de los visitantes.",
        },
    ]

    return (
        <section className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-8 md:grid-cols-5 md:gap-12">
                    <div className="md:col-span-2">
                        <h2 className="text-foreground text-4xl font-semibold">FAQs</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">Your questions answered</p>
                        <p className="text-muted-foreground mt-6 hidden md:block">
                            Can't find what you're looking for? Contact our{' '}
                            <Link
                                href="#"
                                className="text-primary font-medium hover:underline">
                                customer support team
                            </Link>
                        </p>
                    </div>

                    <div className="md:col-span-3">
                        <Accordion
                            type="single"
                            collapsible>
                            {faqItems.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={item.id}>
                                    <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-base">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    <p className="text-muted-foreground mt-6 md:hidden">
                        Can't find what you're looking for? Contact our{' '}
                        <Link
                            href="#"
                            className="text-primary font-medium hover:underline">
                            customer support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
