import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [oldStr, newStr] of replacements) {
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

// Fix budget hooks
const hooks = [
  'src/hooks/use-budgets.ts',
  'src/hooks/use-budget-categories.ts',
  'src/hooks/use-budget-stats.ts',
];

for (const h of hooks) {
  const p = path.join('/Users/zerbib/clickup-clone', h);
  replaceInFile(p, [
    ['const fetcher = (url: string) => fetch(url).then((r) => r.json());',
     'const fetcher = async (url: string) => {\n  const r = await fetch(url);\n  if (!r.ok) throw new Error("Failed to fetch");\n  return r.json();\n};'],
  ]);
}

// Fix finance components
const components = [
  'src/components/finance/account-list.tsx',
  'src/components/finance/add-account-dialog.tsx',
  'src/components/finance/add-goal-dialog.tsx',
  'src/components/finance/add-transaction-dialog.tsx',
  'src/components/finance/category-manager.tsx',
  'src/components/finance/expense-chart.tsx',
  'src/components/finance/goal-list.tsx',
  'src/components/finance/income-expense-chart.tsx',
  'src/components/finance/transaction-list.tsx',
];

for (const c of components) {
  const p = path.join('/Users/zerbib/clickup-clone', c);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  // Remove eslint-disable
  if (content.includes('/* eslint-disable @typescript-eslint/no-explicit-any */')) {
    content = content.replace('/* eslint-disable @typescript-eslint/no-explicit-any */\n', '');
    changed = true;
  }

  // Remove simple any annotations in callbacks
  const simpleAnys = [
    [/(\(c: any\))/, '(c)'],
    [/(\(a: any\))/, '(a)'],
    [/(\(t: any\))/, '(t)'],
    [/(\(item: any\))/, '(item)'],
    [/(\(entry: any\))/, '(entry)'],
    [/(\(value: any\))/, '(value)'],
    [/(\(goal: any\))/, '(goal)'],
    [/(\(account: any\))/, '(account)'],
  ];

  for (const [regex, replacement] of simpleAnys) {
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

console.log('Done');
