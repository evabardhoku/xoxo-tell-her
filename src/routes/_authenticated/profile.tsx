import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ProfileEditor } from '@/components/profile-editor';
import { profileQuery } from '@/lib/profile';
import { SignOut } from '@/components/app-shell';
import { pageHead } from '@/lib/metadata';
export const Route = createFileRoute('/_authenticated/profile')({ loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery), head: () => pageHead('Profile', 'Your private TellHer account and profile.'), component: Profile });
function Profile() {
 const { data, refetch } = useSuspenseQuery(profileQuery);
 return <><div className="page-heading"><div><div className="eyebrow">PROFILE</div><h1>A space that’s yours.</h1><p>Your name, your account, your own pace.</p></div></div><ProfileEditor profile={data} onSaved={refetch} /><div className="mt-6"><SignOut /></div></>;
}