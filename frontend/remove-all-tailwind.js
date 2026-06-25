const fs = require('fs');
const path = require('path');

const filePaths = [
    'src/app/page.tsx',
    'src/app/login/page.tsx',
    'src/app/register/page.tsx',
    'src/app/admin/parts/page.tsx',
    'src/app/admin/reports/page.tsx',
    'src/app/admin/users/page.tsx',
    'src/app/admin/vendors/page.tsx',
    'src/app/staff/customers/page.tsx',
    'src/app/staff/reports/page.tsx',
    'src/app/staff/sales/page.tsx'
];

filePaths.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Remove className="..."
        content = content.replace(/className="[^"]*"/g, '');
        
        // Remove className={'...'}
        content = content.replace(/className=\{['"][^'"]*['"]\}/g, '');
        
        // Remove className={...} which might span multiple lines
        content = content.replace(/className=\{[\s\S]*?\}/g, '');

        // For src/app/page.tsx and others that might have layout components, 
        // we might just want to be sure it's stripped.
        fs.writeFileSync(fullPath, content);
        console.log('Processed ' + fullPath);
    } else {
        console.log('Not found: ' + fullPath);
    }
});
