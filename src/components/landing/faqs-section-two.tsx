
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQs() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'What is AgentVerse?',
            answer: 'AgentVerse is a platform that allows you to create, train, and deploy artificial intelligence agents for your business. These agents can automate customer support, answer questions, and perform tasks across different channels like chat, email, and phone.',
        },
        {
            id: 'item-2',
            question: 'What are "credits" and how are they used?',
            answer: 'Credits are used for interactions with the AI. Each time the agent answers a question or executes a complex task, a certain amount of credits is consumed. Your monthly plan includes a number of credits that renews each month.',
        },
        {
            id: 'item-3',
            question: "What happens if I run out of credits?",
            answer: 'If you run out of your monthly credits, your agents will stop responding until your plan renews or until you upgrade to a higher plan with more credits.',
        },
        {
            id: 'item-4',
            question: 'Is my data secure?',
            answer: "Security is our top priority. All your data is stored securely, and you have full control over it, including retention policies and the option to anonymize visitor information.",
        },
    ]

    return (
        <section className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-8 md:grid-cols-5 md:gap-12">
                    <div className="md:col-span-2">
                        <h2 className="text-foreground text-4xl font-semibold">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">Your questions answered</p>
                        <p className="text-muted-foreground mt-6 hidden md:block">
                            Can't find what you're looking for? Contact our{' '}
                            <Link
                                href="#"
                                className="text-primary font-medium hover:underline">
                                support team
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
                            support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
