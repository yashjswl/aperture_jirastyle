const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  if (code.includes('isWebadmin')) {
    // maybe already there
  } else {
    code = code.replace('import { auth } from "@/auth";', 'import { auth } from "@/auth";\nimport { isWebadmin } from "@/lib/roles";');
  }

  // directory/actions.ts
  if (filepath.includes('directory')) {
    code = code.replace(
      'if (!session?.user || session.user.id !== targetUserId) {',
      'if (!session?.user || !isWebadmin(session.user.role)) {'
    );
    code = code.replace(
      'return { error: "You can only edit your own profile." };',
      'return { error: "Only Webadmins can make changes." };'
    );
  }

  // profile/actions.ts
  if (filepath.includes('profile')) {
    code = code.replace(
      'if (!session?.user) return { error: "Not authenticated" };',
      'if (!session?.user || !isWebadmin(session.user.role)) return { error: "Only Webadmins can make changes." };'
    );
  }

  fs.writeFileSync(filepath, code);
}

patchFile('src/app/(portal)/directory/actions.ts');
patchFile('src/app/(portal)/profile/actions.ts');
