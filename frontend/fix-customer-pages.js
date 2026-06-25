const fs = require('fs');
const path = require('path');

const files = [
    'src/app/customer/appointments/page.tsx',
    'src/app/customer/vehicles/page.tsx',
    'src/app/customer/history/page.tsx',
    'src/app/customer/profile/page.tsx',
    'src/app/customer/requests/page.tsx',
    'src/app/customer/reviews/page.tsx'
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');

    // Super naive generic styling just to get things looking okay!
    content = content.replace(/<div >\s*<div >\s*<h1 >(.*?)<\/h1>/, '<div className="space-y-8">\n<div className="page-header">\n<h1 className="page-header-title"></h1>');
    content = content.replace(/<h2 >/g, '<h2 className="card-title">');
    content = content.replace(/<h3 >/g, '<h3 className="card-title">');
    content = content.replace(/<button /g, '<button className="btn-primary" ');
    content = content.replace(/<input /g, '<input className="form-input" ');
    content = content.replace(/<textarea /g, '<textarea className="form-input" ');
    content = content.replace(/<select /g, '<select className="form-input" ');
    
    // We can't perfectly guess which divs are cards, but let's try to find list items.
    
    fs.writeFileSync(fullPath, content);
    console.log('Fixed ' + file);
});
