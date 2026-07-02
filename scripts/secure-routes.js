const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src/app/api/tasks/[taskId]');

function processFile(filePath) {
  if (filePath.endsWith('route.ts') && !filePath.endsWith('[taskId]/route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add import if missing
    if (!content.includes('verifyTaskAccess')) {
      content = content.replace(
        'import { getCurrentUser } from "@/lib/auth-helpers";',
        'import { getCurrentUser } from "@/lib/auth-helpers";\nimport { verifyTaskAccess } from "@/lib/task-auth";'
      );
      modified = true;
    }

    // Replace the common pattern
    const regex = /const user = await getCurrentUser\(\);\n\s*if \(!user\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);\n\s*const \{ taskId \} = await params;/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, `const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { taskId } = await params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });`);
      modified = true;
    }
    
    // Some might have context instead of just { params }
    const regex2 = /const \{ taskId \} = await context\.params;/g;
    if (regex2.test(content) && !content.includes('verifyTaskAccess(taskId, user.id)')) {
      content = content.replace(regex2, `const { taskId } = await context.params;
    if (!(await verifyTaskAccess(taskId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });`);
      modified = true;
    }

    // Some might have DELETE(req: Request) without params
    const regex3 = /export async function DELETE\(req: Request\) \{[\s\S]*?const user = await getCurrentUser\(\);[\s\S]*?if \(!user\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);/g;
    if (regex3.test(content) && filePath.includes('attachments')) {
        // I noticed attachments DELETE doesn't have taskId in params.
        // It fetches it from attachment.userId !== user.id, which is already secure because it checks attachment.userId!
        // So attachments DELETE is already secure against other users deleting it!
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}

function walk(directory) {
  const items = fs.readdirSync(directory);
  for (const item of items) {
    const fullPath = path.join(directory, item);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

walk(dir);
