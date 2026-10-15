import { createFileRoute } from '@tanstack/react-router';
import { FoundationPage } from '@/components/foundation-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/wingwoman')({ head: () => pageHead('Wingwoman', 'A private space to reflect before reaching out on TellHer.'), component: () => <FoundationPage kind="wingwoman" /> });