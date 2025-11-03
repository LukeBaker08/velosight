import { orchestrate } from '../index';

console.log('[run-once] boot');

async function main() {
  const res = await orchestrate({
    systemId: 'assurance-analyst-v1',
    promptId: 'risk-scan-v1',
    userVars: { projectName: 'TestProj', question: 'What are the obvious risks?' },
    retrieval: {
      query: 'governance schedule budget vendor risks', // ignored in Phase 0
    },
  });

  // Minimal assertion-ish prints
  console.log('--- RAW TEXT ---');
  console.log(res.rawText);
  console.log('\n--- PARSED OUTPUT ---');
  console.log(res.output);
  console.log('\n--- USED CHUNKS (should be empty in Phase 0) ---');
  console.log(res.usedChunks);
}

main().catch((e) => {
  console.error('Smoke test failed:', e);
  process.exit(1);
});
