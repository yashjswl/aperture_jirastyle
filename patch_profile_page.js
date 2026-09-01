const fs = require('fs');

let code = fs.readFileSync('src/app/(portal)/profile/page.tsx', 'utf8');

if (!code.includes('isWebadmin')) {
  code = code.replace('import { auth } from "@/auth";', 'import { auth } from "@/auth";\nimport { isWebadmin } from "@/lib/roles";');
}

code = code.replace(
  'return (',
  `
  const canEdit = isWebadmin(session.user.role);
  
  return (
`
);

code = code.replace(
  /<Card className="p-6">\s*<ProfileForm[\s\S]*?\/>\s*<\/Card>/,
  `{canEdit ? (
      <Card className="p-6">
        <ProfileForm 
          initialName={user.name || ""} 
          email={user.email} 
          initialTitle={user.title}
          initialBio={user.bio}
          initialAvatarUrl={user.avatarUrl}
          initialContactNumber={user.contactNumber}
        />
      </Card>
      ) : (
      <Card className="p-6">
        <p className="text-sm text-muted">You do not have permission to edit your profile. Contact a Webadmin to make changes.</p>
      </Card>
      )}`
);

fs.writeFileSync('src/app/(portal)/profile/page.tsx', code);
