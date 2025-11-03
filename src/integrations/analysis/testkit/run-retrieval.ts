import { orchestrate } from '../index';

async function main() {
  const res = await orchestrate({
    systemId: 'assurance-analyst-v1',
    promptId: 'risk-scan-v1',
    userVars: { projectName: 'ESDT', question: 'Top 3 risks & why?' },
    retrieval: {
      query: 'delivery confidence schedule slippage vendor performance governance issues benefits',
      filters: { projectId: 'PUT-YOUR-PROJECT-UUID-HERE' } // or omit if not needed
    },
    assemble: {
      perSourceK: { project: 4, context: 3, sentiment: 2, framework: 6 },
      maxChars: 8000
    }
  });

  console.log('--- USED CHUNKS ---');
  console.table(res.usedChunks.map(c => ({
    id: c.id,
    source: c.source,
    score: c.score.toFixed(3),
    preview: (c.content || '').slice(0, 60).replace(/\s+/g,' ') + '...'
  })));

  console.log('\n--- RAW TEXT (JSON) ---');
  console.log(res.rawText);

  console.log('\n--- PARSED JSON ---');
  console.dir(res.output, { depth: null });
}

main().catch(e => {
  console.error('run-retrieval failed:', e);
  process.exit(1);
});
