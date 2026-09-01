const fs = require('fs');

let code = fs.readFileSync('src/app/(portal)/directory/[id]/page.tsx', 'utf8');
code = code.replace('{canEdit {isOwnProfile && ({isOwnProfile && ( (', '{canEdit && (');

fs.writeFileSync('src/app/(portal)/directory/[id]/page.tsx', code);
