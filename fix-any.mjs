import fs from 'fs';
import path from 'path';

const dir = '/Users/zerbib/clickup-clone/src/components/finance';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  const replacements = [
    [/\(c: any\)/g, '(c)'],
    [/\(a: any\)/g, '(a)'],
    [/\(t: any\)/g, '(t)'],
    [/\(item: any\)/g, '(item)'],
    [/\(entry: any\)/g, '(entry)'],
    [/\(value: any\)/g, '(value)'],
    [/\(goal: any\)/g, '(goal)'],
    [/\(account: any\)/g, '(account)'],
    [/\(data: any\[\]\)/g, '(data)'],
    [/\(sum: number, t: any\)/g, '(sum, t)'],
    [/\(sum: number, a: any\)/g, '(sum, a)'],
    [/\(sum: number, g: any\)/g, '(sum, g)'],
    [/\(sum: number, item: any\)/g, '(sum, item)'],
    [/\(sum, a: any\)/g, '(sum, a)'],
    [/\(sum, t: any\)/g, '(sum, t)'],
    [/\(sum, g: any\)/g, '(sum, g)'],
    [/\(sum, item: any\)/g, '(sum, item)'],
    [/\(v: any\)/g, '(v)'],
    [/\(props: any\)/g, '(props: React.SVGProps<SVGSVGElement>)'],
  ];

  for (const [regex, replacement] of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated', p);
  }
}
