import { createFileRoute } from '@tanstack/react-router';
import { FoundationPage } from '@/components/foundation-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/home')({ head: () => pageHead('Home', 'Your private TellHer space for Trust Ripples and second perspectives.'), component: () => <FoundationPage kind="home" /> });