import { requireRole } from '@/lib/session';
import ProfileForm from '@/components/dash/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireRole('student');
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[12px] font-[750] uppercase tracking-[0.2em] text-[#E51A24]">My Profile</p>
      <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.6rem)] font-[800] tracking-[-0.025em] text-[#1A1A1A]">
        Student <span className="font-serif-accent font-normal italic text-[#6C757D]">details.</span>
      </h1>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <span className="glass rounded-full px-4 py-2 text-[12px] font-[700]">ID · <span className="text-[#E51A24]">{user.studentId}</span></span>
        <span className="glass rounded-full px-4 py-2 text-[12px] font-[700] text-[#6C757D]">{user.email}</span>
      </div>
      <div className="glass mt-8 rounded-[30px] p-7 md:p-9">
        <ProfileForm
          initial={{
            name: user.name, phone: user.phone ?? '', whatsapp: user.whatsapp ?? '',
            fatherName: user.fatherName ?? '', motherName: user.motherName ?? '',
            className: user.className ?? '', address: user.address ?? '',
            profileImage: user.profileImage ?? null,
          }}
        />
      </div>
    </div>
  );
}
