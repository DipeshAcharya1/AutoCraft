const fs = require('fs');
const path = require('path');

const directories = [
    'src/app/customer/appointments',
    'src/app/customer/history',
    'src/app/customer/profile',
    'src/app/customer/requests',
    'src/app/customer/reviews',
    'src/app/customer/vehicles'
];

directories.forEach(dir => {
    const pagePath = path.join(__dirname, dir, 'page.tsx');
    if (fs.existsSync(pagePath)) {
        let content = fs.readFileSync(pagePath, 'utf8');
        
        // Remove className="..."
        content = content.replace(/className="[^"]*"/g, '');
        
        // Remove className={'...'}
        content = content.replace(/className=\{['"][^'"]*['"]\}/g, '');
        
        // Remove className={...} which might span multiple lines
        content = content.replace(/className=\{[\s\S]*?\}/g, '');
        
        fs.writeFileSync(pagePath, content);
        console.log('Processed ' + pagePath);
    } else {
        console.log('Not found: ' + pagePath);
    }
});
