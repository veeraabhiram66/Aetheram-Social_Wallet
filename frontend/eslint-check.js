// Quick ESLint verification script
const { ESLint } = require('eslint');

async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/hooks/useGuardians.js']);
  
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  
  console.log(resultText);
  
  // Check if there are any errors
  const hasErrors = results.some(result => result.errorCount > 0);
  console.log(`\n✅ ESLint Status: ${hasErrors ? '❌ ERRORS FOUND' : '✅ NO ERRORS'}`);
}

main().catch(console.error);
