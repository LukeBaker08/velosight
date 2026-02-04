import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY!;
const apiVersion = "2024-07-01";

async function createIndex(indexName: string, indexDefinition: any) {
  const url = `${endpoint}/indexes/${indexName}?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(indexDefinition)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create index ${indexName}: ${error}`);
  }

  // Handle empty response body (common on 201/204)
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

async function createProjectContextSentimentIndex() {
  console.log("Creating project-context-sentiment-vectors index...");

  const indexDef = {
    name: "project-context-sentiment-vectors",
    fields: [
      {
        name: "id",
        type: "Edm.String",
        key: true,
        searchable: false,
        filterable: false
      },
      {
        name: "content",
        type: "Edm.String",
        searchable: true
      },
      {
        name: "embedding",
        type: "Collection(Edm.Single)",
        searchable: true,
        dimensions: 1536,
        vectorSearchProfile: "vector-profile"
      },
      {
        name: "project_id",
        type: "Edm.String",
        filterable: true,
        facetable: true
      },
      {
        name: "document_id",
        type: "Edm.String",
        filterable: true
      },
      {
        name: "category",
        type: "Edm.String",
        filterable: true,
        facetable: true
      },
      {
        name: "type",
        type: "Edm.String",
        filterable: true
      },
      {
        name: "name",
        type: "Edm.String",
        searchable: true
      },
      {
        name: "chunk_idx",
        type: "Edm.Int32",
        filterable: true
      },
      {
        name: "chunk_count",
        type: "Edm.Int32"
      }
    ],
    vectorSearch: {
      algorithms: [
        {
          name: "vector-algo",
          kind: "hnsw"
        }
      ],
      profiles: [
        {
          name: "vector-profile",
          algorithm: "vector-algo"
        }
      ]
    }
  };

  await createIndex("project-context-sentiment-vectors", indexDef);
  console.log("✓ Created project-context-sentiment-vectors index");
  console.log("  - Handles: project, context, and sentiment documents");
  console.log("  - Filters by 'category' field");
}

async function createFrameworkIndex() {
  console.log("\nCreating framework-vectors index...");

  const indexDef = {
    name: "framework-vectors",
    fields: [
      {
        name: "id",
        type: "Edm.String",
        key: true,
        searchable: false
      },
      {
        name: "content",
        type: "Edm.String",
        searchable: true
      },
      {
        name: "embedding",
        type: "Collection(Edm.Single)",
        searchable: true,
        dimensions: 1536,
        vectorSearchProfile: "vector-profile"
      },
      {
        name: "document_id",
        type: "Edm.String",
        filterable: true
      },
      {
        name: "type",
        type: "Edm.String",
        filterable: true
      },
      {
        name: "name",
        type: "Edm.String",
        searchable: true
      },
      {
        name: "chunk_idx",
        type: "Edm.Int32",
        filterable: true
      },
      {
        name: "chunk_count",
        type: "Edm.Int32"
      }
    ],
    vectorSearch: {
      algorithms: [
        {
          name: "vector-algo",
          kind: "hnsw"
        }
      ],
      profiles: [
        {
          name: "vector-profile",
          algorithm: "vector-algo"
        }
      ]
    }
  };

  await createIndex("framework-vectors", indexDef);
  console.log("✓ Created framework-vectors index");
  console.log("  - Handles: framework materials (global)");
  console.log("  - No project_id or category fields");
}

async function main() {
  console.log("================================================================================");
  console.log("Creating Azure AI Search Indexes - FREE TIER APPROACH");
  console.log("================================================================================\n");
  console.log("Creating 2 indexes (fits Free tier: max 3 indexes, 50 MB, $0/month):\n");

  try {
    await createProjectContextSentimentIndex();
    await createFrameworkIndex();

    console.log("\n================================================================================");
    console.log("✓ All indexes created successfully!");
    console.log("================================================================================\n");
    console.log("Index Summary:");
    console.log("  1. project-context-sentiment-vectors");
    console.log("     - Categories: project, context, sentiment");
    console.log("     - Query with: category eq 'project' | 'context' | 'sentiment'");
    console.log("");
    console.log("  2. framework-vectors");
    console.log("     - Global framework materials");
    console.log("     - No project filtering");
    console.log("\n");
    console.log("Next: Verify indexes in Azure Portal → AI Search → Indexes");
  } catch (error) {
    console.error("\n❌ Error creating indexes:", error);
    console.error("\nTroubleshooting:");
    console.error("  1. Check AZURE_SEARCH_ENDPOINT is set correctly");
    console.error("  2. Check AZURE_SEARCH_ADMIN_KEY is set correctly");
    console.error("  3. Verify Azure AI Search service is created");
    process.exit(1);
  }
}

main().catch(console.error);
