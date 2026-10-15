import { createFileRoute } from '@tanstack/react-router';
import { FoundationPage } from '@/components/foundation-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/ripple')({ head: () => pageHead('Start a Ripple', 'The beginning of an anonymous question, shared through trust.'), component: () => <FoundationPage kind="ripple" /> });