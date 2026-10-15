import { createFileRoute } from '@tanstack/react-router';
import { FoundationPage } from '@/components/foundation-page';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/circle')({ head: () => pageHead('MyCircle', 'Your small circle of trusted women on TellHer.'), component: () => <FoundationPage kind="circle" /> });