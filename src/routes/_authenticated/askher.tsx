import { createFileRoute } from '@tanstack/react-router';
import { FoundationPage } from '@/components/foundation-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/askher')({ head: () => pageHead('AskHer', 'Thoughtful questions and perspectives from women in your trust network.'), component: () => <FoundationPage kind="askher" /> });